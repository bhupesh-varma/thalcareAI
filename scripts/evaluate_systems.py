import os
import psycopg2
import requests
import time
import numpy as np
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DB = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
}

OLLAMA_URL = os.getenv("OLLAMA_URL")
MODEL = os.getenv("OLLAMA_MODEL")

TEST_QUERY = "urgent accident need O+ blood trauma hospital nearby"
CITY = "Delhi"
USER_LAT = 28.6139
USER_LON = 77.2090
K = 5

def embed(text):
    r = requests.post(OLLAMA_URL, json={"model": MODEL, "prompt": text})
    return r.json()["embedding"]

def is_relevant(row):
    # blood>0, ICU>0, trauma<=2
    return row[3] > 0 and row[2] > 0

conn = psycopg2.connect(**DB)
cur = conn.cursor()

query_emb = embed(TEST_QUERY)

results = []

# ---------- SQL ONLY ----------
start = time.time()

cur.execute("""
SELECT name, rating, icu_beds_available, blood_o_pos
FROM hospitals
WHERE city=%s AND blood_o_pos>0
ORDER BY rating DESC
LIMIT %s;
""", (CITY, K))

rows = cur.fetchall()
sql_time = time.time() - start

sql_precision = sum(is_relevant(r) for r in rows) / K

# ---------- VECTOR ONLY ----------
start = time.time()

cur.execute("""
SELECT name, rating, icu_beds_available, blood_o_pos
FROM hospitals
ORDER BY embedding <-> %s::vector
LIMIT %s;
""", (query_emb, K))

rows2 = cur.fetchall()
vec_time = time.time() - start
vec_precision = sum(is_relevant(r) for r in rows2) / K

# ---------- HYBRID ----------
start = time.time()

cur.execute("""
SELECT name, rating, icu_beds_available, blood_o_pos
FROM hospitals
WHERE city=%s AND blood_o_pos>0
ORDER BY embedding <-> %s::vector
LIMIT %s;
""", (CITY, query_emb, K))

rows3 = cur.fetchall()
hyb_time = time.time() - start
hyb_precision = sum(is_relevant(r) for r in rows3) / K

print("\nRESULTS\n")
print("SQL Precision@5:", sql_precision, "Time:", sql_time)
print("Vector Precision@5:", vec_precision, "Time:", vec_time)
print("Hybrid Precision@5:", hyb_precision, "Time:", hyb_time)

df = pd.DataFrame({
    "System": ["SQL", "Vector", "Hybrid"],
    "Precision@5": [sql_precision, vec_precision, hyb_precision],
    "Latency": [sql_time, vec_time, hyb_time]
})

df.to_csv("evaluation.csv", index=False)

print("\nSaved evaluation.csv")

cur.close()
conn.close()
