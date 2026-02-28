from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta, date
from databases import SessionLocal
from models import ThalassemiaProfile, User
from auth import hash_password

router = APIRouter()

def get_db():
    db = SessionLocal
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(data: dict, db: Session = Depends(get_db)):

    if db.query(User).filter(User.email == data["email"]).first():
        raise HTTPException(status_code=400, detail= 'Email already exists.')

    user = User(
        email = data["email"],
        password_hash = hash_password(data["password"]),
        phone = data.get("phone"),  
        role = data["role"]
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    if data["role"] == "thalassemia":
        last_transfusion = data.fromisoformat(data["last_transfusion"])
        interval = int(data["interval_days"])
        next_due = last_transfusion + timedelta(days=interval)

        profile = ThalassemiaProfile(
            user_id = user.id,
            full_name = data["full_name"],
            age = data["age"],
            blood_group = data["blood_group"],
            last_transfusion = last_transfusion,
            transfusion_interval_days = interval,
            next_due_date = next_due,
            city = data['city']
        )

        db.add(profile)
        db.commit()
    
    return {"message": "User Registered Successfully."}