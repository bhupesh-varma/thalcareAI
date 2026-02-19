import os
import psycopg2
import requests
import math
import pandas as pd
import matplotlib.pyplot as plt
from dotenv import load_dotenv

load_dotenv()

# ---------------- CONFIG ----------------

DB = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
}

OLLAMA_URL = os.getenv("OLLAMA_URL")
MODEL = os.getenv("OLLAMA_MODEL")

CITY = "Delhi"
USER_LAT = 28.6139
USER_LON = 77.2090
K = 5

QUERIES = [
    "road accident O+ blood",
    "heart attack ICU nearby",
    "child emergency blood needed",
    "major trauma case",
    "severe bleeding patient",
    "ambulance emergency",
    "stroke emergency",
    "critical surgery blood",
    "accident victim ICU",
    "urgent blood transfusion"
]

# ---------------- EMBEDDING ----------------

def embed(text):
    r = requests.post(OLLAMA_URL, json={"model": MODEL, "prompt": text})
    return r.json()["embedding"]

# ---------------- RELEVANCE FUNCTION ----------------

def relevance(row):
    # row = name, rating, icu, blood, distance
    score = 0

    # Distance weight
    if row[4] < 5:
        score += 3
    elif row[4] < 15:
        score += 1

    # Blood availability
    if row[3] >= 10:
        score += 2
    elif row[3] > 0:
        score += 1

    # ICU availability
    if row[2] >= 5:
        score += 2
    elif row[2] > 0:
        score += 1

    return score

def ndcg(scores):
    dcg = sum((2**s - 1) / math.log2(i + 2) for i, s in enumerate(scores))
    ideal = sorted(scores, reverse=True)
    idcg = sum((2**s - 1) / math.log2(i + 2) for i, s in enumerate(ideal))
    return dcg / idcg if idcg > 0 else 0

# ---------------- DATABASE ----------------

conn = psycopg2.connect(**DB)
cur = conn.cursor()

systems = {"SQL": [], "Vector": [], "Hybrid": []}

# ---------------- RUN QUERIES ----------------

for q in QUERIES:

    q_emb = embed(q)

    # SQL
    cur.execute("""
    SELECT name,rating,icu_beds_available,blood_o_pos,
    6371*acos(
        cos(radians(%s))*cos(radians(lat))*cos(radians(lon)-radians(%s))+
        sin(radians(%s))*sin(radians(lat))
    )
    FROM hospitals
    WHERE blood_o_pos > 0
    ORDER BY avg_response_time_mins ASC
    LIMIT %s;
    """, (USER_LAT, USER_LON, USER_LAT, K))
    systems["SQL"].append(cur.fetchall())

    # VECTOR
    cur.execute("""
    SELECT name,rating,icu_beds_available,blood_o_pos,
    6371*acos(
        cos(radians(%s))*cos(radians(lat))*cos(radians(lon)-radians(%s))+
        sin(radians(%s))*sin(radians(lat))
    )
    FROM hospitals
    ORDER BY embedding <-> %s::vector
    LIMIT %s;
    """, (USER_LAT, USER_LON, USER_LAT, q_emb, K))
    systems["Vector"].append(cur.fetchall())

    # HYBRID
    cur.execute("""
    SELECT name,rating,icu_beds_available,blood_o_pos,
    6371*acos(
        cos(radians(%s))*cos(radians(lat))*cos(radians(lon)-radians(%s))+
        sin(radians(%s))*sin(radians(lat))
    )
    FROM hospitals
    WHERE city=%s AND blood_o_pos>0
    ORDER BY
        (embedding <-> %s::vector) * 0.5 +
        (
            6371*acos(
                cos(radians(%s))*cos(radians(lat))*cos(radians(lon)-radians(%s))+
                sin(radians(%s))*sin(radians(lat))
            )
        ) * 0.3 +
        (avg_response_time_mins/60.0) * 0.1 +
        (1.0/rating) * 0.1
    LIMIT %s;
    """, (
        USER_LAT, USER_LON, USER_LAT,
        CITY,
        q_emb,
        USER_LAT, USER_LON, USER_LAT,
        K
    ))
    systems["Hybrid"].append(cur.fetchall())

# ---------------- METRICS ----------------

results = []

for name, runs in systems.items():

    mrrs, ndcgs, distances = [], [], []

    for rows in runs:

        rel = [relevance(r) for r in rows]

        first = [i+1 for i,s in enumerate(rel) if s > 0]
        mrr = 1/first[0] if first else 0
        mrrs.append(mrr)

        ndcgs.append(ndcg(rel))
        distances.append(sum(r[4] for r in rows)/len(rows))

    results.append({
        "System": name,
        "MRR": sum(mrrs)/len(mrrs),
        "NDCG@5": sum(ndcgs)/len(ndcgs),
        "AvgDistance": sum(distances)/len(distances)
    })

df = pd.DataFrame(results)

# ---------------- COMPOSITE SCORE ----------------

# Normalize distance (lower is better)
max_dist = df["AvgDistance"].max()
df["NormDistance"] = 1 - (df["AvgDistance"] / max_dist)

# Weighted ranking score
df["FinalScore"] = (
    df["MRR"] * 0.4 +
    df["NDCG@5"] * 0.4 +
    df["NormDistance"] * 0.2
)

df = df.sort_values("FinalScore", ascending=False)

print("\nFINAL MODEL RANKING:\n")
print(df)

# ---------------- VISUALIZATION ----------------

# MRR
plt.figure()
plt.bar(df["System"], df["MRR"])
plt.title("MRR Comparison")
plt.ylabel("MRR")
plt.show()

# NDCG
plt.figure()
plt.bar(df["System"], df["NDCG@5"])
plt.title("NDCG@5 Comparison")
plt.ylabel("NDCG@5")
plt.show()

# Distance
plt.figure()
plt.bar(df["System"], df["AvgDistance"])
plt.title("Average Distance Comparison")
plt.ylabel("Distance (km)")
plt.show()

# ---------------- HYBRID ANALYSIS ----------------

hybrid = df[df["System"] == "Hybrid"].iloc[0]

print("\nHYBRID MODEL STRENGTH ANALYSIS:\n")

if hybrid["MRR"] == df["MRR"].max():
    print("✓ Hybrid ranks relevant hospitals higher (Best MRR).")

if hybrid["NDCG@5"] == df["NDCG@5"].max():
    print("✓ Hybrid provides best overall ranking quality (Best NDCG).")

if hybrid["AvgDistance"] == df["AvgDistance"].min():
    print("✓ Hybrid selects geographically closer hospitals.")

if hybrid["FinalScore"] == df["FinalScore"].max():
    print("✓ Hybrid achieves best overall composite ranking score.")

cur.close()
conn.close()
