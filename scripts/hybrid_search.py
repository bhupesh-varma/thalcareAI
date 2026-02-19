import os
import psycopg2
import requests
from dotenv import load_dotenv

load_dotenv()

# ---------- ENV CONFIG ----------
OLLAMA_URL = os.getenv("OLLAMA_URL")
MODEL = os.getenv("OLLAMA_MODEL")

DB = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
}

# ---------- EMBEDDING FUNCTION ----------
def embed(text):
    r = requests.post(
        OLLAMA_URL,
        json={"model": MODEL, "prompt": text},
        timeout=60
    )
    r.raise_for_status()
    return r.json()["embedding"]


# ---------- HYBRID SEARCH FUNCTION ----------
def hybrid_search(city, blood_col, user_query, user_lat, user_lon, limit=5):
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    query_embedding = embed(user_query)

    sql = f"""
    SELECT
        name,
        rating,
        avg_response_time_mins,
        icu_beds_available,
        {blood_col},

        -- Distance in KM
        6371 * acos(
            cos(radians(%s)) * cos(radians(lat)) *
            cos(radians(lon) - radians(%s)) +
            sin(radians(%s)) * sin(radians(lat))
        ) AS distance_km

    FROM hospitals
    WHERE city = %s
      AND {blood_col} > 0

    ORDER BY
        -- Hybrid weighted ranking
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

    LIMIT %s;
    """

    cur.execute(sql, (
        user_lat,      # distance calc
        user_lon,
        user_lat,
        city,
        query_embedding,
        user_lat,      # distance in ORDER BY
        user_lon,
        user_lat,
        limit
    ))

    results = cur.fetchall()

    cur.close()
    conn.close()

    return results


# ---------- TEST RUN ----------
if __name__ == "__main__":

    # Example: User location in Delhi
    user_lat = 28.6139
    user_lon = 77.2090

    results = hybrid_search(
        city="Delhi",
        blood_col="blood_o_pos",
        user_query="urgent road accident needs O+ blood trauma hospital nearby",
        user_lat=user_lat,
        user_lon=user_lon,
        limit=5
    )

    print("\nTop Hospital Recommendations:\n")

    for r in results:
        print(
            f"Hospital: {r[0]}\n"
            f"  Rating: {r[1]}\n"
            f"  Response Time: {r[2]} mins\n"
            f"  ICU Beds: {r[3]}\n"
            f"  Blood Units Available: {r[4]}\n"
            f"  Distance: {round(r[5], 2)} km\n"
            f"{'-'*50}"
        )
