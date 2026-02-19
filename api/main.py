import os
import psycopg2
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Blood Donation Hybrid RAG API")

# ---------- ENV ----------
DB = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
}

EMBED_MODEL = os.getenv("OLLAMA_MODEL")
EXPLAIN_MODEL = os.getenv("EXPLAIN_MODEL")

OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
OLLAMA_CHAT_URL = "http://localhost:11434/api/generate"

# ---------- REQUEST SCHEMA ----------
class SearchRequest(BaseModel):
    city: str
    blood_type: str   # example: blood_o_pos
    query: str
    user_lat: float
    user_lon: float


# ---------- OLLAMA EMBED ----------
def embed(text):
    r = requests.post(OLLAMA_EMBED_URL, json={
        "model": EMBED_MODEL,
        "prompt": text
    }, timeout=60)
    return r.json()["embedding"]


# ---------- EXPLANATION LLM ----------
def explain(hospital):
    prompt = f"""
Explain simply why this hospital is recommended in an emergency:

Hospital: {hospital['name']}
Distance: {hospital['distance']} km
Rating: {hospital['rating']}
Response time: {hospital['response']} minutes
ICU beds: {hospital['icu']}
Blood units available: {hospital['blood']}

Give a short human friendly explanation.
"""

    r = requests.post(OLLAMA_CHAT_URL, json={
        "model": EXPLAIN_MODEL,
        "prompt": prompt,
        "stream": False
    }, timeout=60)

    return r.json()["response"]


# ---------- HYBRID SEARCH ----------
def hybrid_search(city, blood_col, user_query, user_lat, user_lon):
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    q_emb = embed(user_query)

    sql = f"""
    SELECT
        name,
        rating,
        avg_response_time_mins,
        icu_beds_available,
        {blood_col},

        6371 * acos(
            cos(radians(%s)) * cos(radians(lat)) *
            cos(radians(lon) - radians(%s)) +
            sin(radians(%s)) * sin(radians(lat))
        ) AS distance_km

    FROM hospitals
    WHERE city = %s
      AND {blood_col} > 0

    ORDER BY
        (embedding <-> %s::vector) * 0.5 +
        (
            6371 * acos(
                cos(radians(%s)) * cos(radians(lat)) *
                cos(radians(lon) - radians(%s)) +
                sin(radians(%s)) * sin(radians(lat))
            )
        ) * 0.3 +
        (avg_response_time_mins / 60.0) * 0.1 +
        (1.0 / rating) * 0.1

    LIMIT 5;
    """

    cur.execute(sql, (
        user_lat,
        user_lon,
        user_lat,
        city,
        q_emb,
        user_lat,
        user_lon,
        user_lat
    ))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    hospitals = []

    for r in rows:
        hospitals.append({
            "name": r[0],
            "rating": float(r[1]),
            "response": r[2],
            "icu": r[3],
            "blood": r[4],
            "distance": round(r[5], 2)
        })

    return hospitals


# ---------- API ENDPOINT ----------
@app.post("/recommend")
def recommend(req: SearchRequest):

    hospitals = hybrid_search(
        city=req.city,
        blood_col=req.blood_type,
        user_query=req.query,
        user_lat=req.user_lat,
        user_lon=req.user_lon
    )

    for h in hospitals:
        h["explanation"] = explain(h)

    return {
        "recommendations": hospitals
    }
