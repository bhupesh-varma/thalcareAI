import os
import psycopg2
import requests
import math
import pandas as pd
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

# ---------------- HELPERS ----------------

def embed(text):
    r = requests.post(OLLAMA_URL, json={"model": MODEL, "prompt": text})
    return r.json()["embedding"]

def relevance(row):
    # row = name, rating, icu, blood, distance
    score = 0

    # Distance (strong weight)
    if row[4] < 5:
        score += 3
    elif row[4] < 15:
        score += 1

    # Blood
    if row[3] >= 10:
        score += 2
    elif row[3] > 0:
        score += 1

    # ICU
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

# ---------------- RUN ALL QUERIES ----------------

for q in QUERIES:

    q_emb = embed(q)

    # -------- SQL ONLY (GLOBAL, NO CITY) --------
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

    # -------- VECTOR ONLY (GLOBAL) --------
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

    # -------- TRUE HYBRID (CITY + VECTOR + DISTANCE + OPS) --------
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

    mrrs = []
    ndcgs = []
    distances = []

    for rows in runs:

        rel = [relevance(r) for r in rows]

        first = [i+1 for i,s in enumerate(rel) if s > 0]
        mrrs.append(1/first[0] if first else 0)

        ndcgs.append(ndcg(rel))
        distances.append(sum(r[4] for r in rows) / len(rows))

    results.append({
        "System": name,
        "MRR": round(sum(mrrs)/len(mrrs), 3),
        "NDCG@5": round(sum(ndcgs)/len(ndcgs), 3),
        "AvgDistance(km)": round(sum(distances)/len(distances), 2)
    })

df = pd.DataFrame(results)
df.to_csv("ranking_eval_multi.csv", index=False)

print("\nFINAL RESULTS:\n")
print(df)

cur.close()
conn.close()
