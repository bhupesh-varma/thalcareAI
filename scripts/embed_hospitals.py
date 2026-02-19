import os
import psycopg2
import requests
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL")
MODEL = os.getenv("OLLAMA_MODEL")

DB = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
}


def get_embedding(text):
    payload = {
        "model": MODEL,
        "prompt": text
    }
    r = requests.post(OLLAMA_URL, json=payload, timeout=60)
    r.raise_for_status()
    return r.json()["embedding"]

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, city, trauma_level, rating,
               avg_response_time_mins,
               icu_beds_available,
               blood_o_pos, blood_a_pos, blood_b_pos, blood_ab_pos
        FROM hospitals
    """)

    rows = cur.fetchall()

    print(f"Embedding {len(rows)} hospitals...")

    for row in tqdm(rows):
        (
            hid, name, city, trauma, rating,
            response, icu,
            o, a, b, ab
        ) = row

        text = f"""
Hospital name: {name}
City: {city}
Trauma level: {trauma}
Rating: {rating}
Average response time: {response} minutes
ICU beds available: {icu}
Blood availability: O+ {o}, A+ {a}, B+ {b}, AB+ {ab}
"""

        emb = get_embedding(text)

        cur.execute(
            "UPDATE hospitals SET embedding = %s WHERE id = %s",
            (emb, hid)
        )

    conn.commit()
    cur.close()
    conn.close()

    print("All embeddings stored.")

if __name__ == "__main__":
    main()
