import os
import psycopg2
import requests
from datetime import datetime, timedelta, date
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# NEW IMPORTS
from jose import jwt
from passlib.context import CryptContext
from apscheduler.schedulers.background import BackgroundScheduler
import smtplib
from email.mime.text import MIMEText
from twilio.rest import Client

load_dotenv()

app = FastAPI(title="Blood Donation Hybrid RAG API")

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- ENV ----------------
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

# ---------------- AUTH CONFIG ----------------
SECRET_KEY = os.getenv("JWT_SECRET", "supersecret")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password):
    password = password.encode("utf-8")[:72]
    return pwd_context.hash(password)

def verify_password(password, hashed):
    password = password.encode("utf-8")[:72]
    return pwd_context.verify(password, hashed)

def create_token(data):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ---------------- EMAIL ----------------
def send_email(to_email, message):
    msg = MIMEText(message)
    msg["Subject"] = "ThalCare Reminder"
    msg["From"] = os.getenv("EMAIL_ADDRESS")
    msg["To"] = to_email

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(os.getenv("EMAIL_ADDRESS"), os.getenv("EMAIL_PASSWORD"))
    server.send_message(msg)
    server.quit()

# ---------------- SMS ----------------
twilio_client = Client(
    os.getenv("TWILIO_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

def send_sms(phone, message):
    twilio_client.messages.create(
        body=message,
        from_=os.getenv("TWILIO_PHONE"),
        to=phone
    )

# ---------------- SCHEMAS ----------------
class SearchRequest(BaseModel):
    city: str
    blood_type: str
    query: str
    user_lat: float
    user_lon: float

class FeedbackRequest(BaseModel):
    hospital: str
    rating: bool
    comment: str = ""
    user_lat: float
    user_lon: float

class RegisterRequest(BaseModel):
    email: str
    password: str
    phone: str
    role: str  # normal or thalassemia
    full_name: str = None
    age: int = None
    blood_group: str = None
    last_transfusion: str = None
    interval_days: int = None
    city: str = None

class LoginRequest(BaseModel):
    email: str
    password: str

# ---------------- OLLAMA EMBED ----------------
def embed(text):
    r = requests.post(OLLAMA_EMBED_URL, json={
        "model": EMBED_MODEL,
        "prompt": text
    }, timeout=60)
    return r.json()["embedding"]

# ---------------- EXPLAIN ----------------
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

# ---------------- HYBRID SEARCH ----------------
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
    LIMIT 5;
    """

    cur.execute(sql, (user_lat, user_lon, user_lat, city))
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

# ---------------- REGISTER ----------------
@app.post("/register")
def register(req: RegisterRequest):

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Create tables if not exist
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT,
        phone TEXT,
        role TEXT
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS thalassemia_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        full_name TEXT,
        age INTEGER,
        blood_group TEXT,
        last_transfusion DATE,
        interval_days INTEGER,
        next_due_date DATE,
        city TEXT
    );
    """)

    try:
        cur.execute("""
        INSERT INTO users (email, password_hash, phone, role)
        VALUES (%s, %s, %s, %s)
        RETURNING id;
        """, (
            req.email,
            hash_password(req.password),
            req.phone,
            req.role
        ))

        user_id = cur.fetchone()[0]

        if req.role == "thalassemia":
            last_date = datetime.strptime(req.last_transfusion, "%Y-%m-%d").date()
            next_due = last_date + timedelta(days=req.interval_days)

            cur.execute("""
            INSERT INTO thalassemia_profiles
            (user_id, full_name, age, blood_group,
             last_transfusion, interval_days, next_due_date, city)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                user_id,
                req.full_name,
                req.age,
                req.blood_group,
                last_date,
                req.interval_days,
                next_due,
                req.city
            ))

        conn.commit()
        return {"status": "success"}

    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}

    finally:
        cur.close()
        conn.close()

# ---------------- LOGIN ----------------
@app.post("/login")
def login(req: LoginRequest):

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    cur.execute("SELECT id, password_hash, role FROM users WHERE email=%s", (req.email,))
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        return {"error": "Invalid credentials"}

    user_id, hashed, role = user

    if not verify_password(req.password, hashed):
        return {"error": "Invalid credentials"}

    token = create_token({"user_id": user_id, "role": role})

    return {"access_token": token}

# ---------------- RECOMMEND ----------------
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

    return {"recommendations": hospitals}

# ---------------- FEEDBACK ----------------
@app.post("/feedback")
def submit_feedback(req: FeedbackRequest):

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        hospital TEXT,
        rating BOOLEAN,
        comment TEXT,
        lat FLOAT,
        lon FLOAT,
        created_at TIMESTAMP DEFAULT NOW()
    );
    """)

    cur.execute("""
    INSERT INTO feedback (hospital, rating, comment, lat, lon)
    VALUES (%s, %s, %s, %s, %s);
    """, (
        req.hospital,
        req.rating,
        req.comment,
        req.user_lat,
        req.user_lon
    ))

    conn.commit()
    cur.close()
    conn.close()

    return {"status": "success"}

# ---------------- REMINDER SCHEDULER ----------------
def check_reminders():

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    today = date.today()

    cur.execute("""
    SELECT u.email, u.phone, t.full_name, t.next_due_date
    FROM thalassemia_profiles t
    JOIN users u ON t.user_id = u.id;
    """)

    rows = cur.fetchall()

    for email, phone, name, next_due in rows:
        if (next_due - today).days <= 2:
            message = f"""
Hi {name},
Your blood transfusion is due on {next_due}.
Please schedule your hospital visit.
"""
            send_email(email, message)
            send_sms(phone, message)

    cur.close()
    conn.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_reminders, "interval", hours=24)

@app.on_event("startup")
def start_scheduler():
    scheduler.start()

# ---------------- EMERGENCY ----------------
@app.get("/emergency")
def emergency():
    return {"message": "Emergency access enabled"}

@app.post("/test-reminder")
def test_reminder():
    check_reminders()
    return {"status": "Reminder function executed"}