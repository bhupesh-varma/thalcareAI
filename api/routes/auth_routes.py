from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from databases import SessionLocal
from models import User
from auth import verify_password, create_token

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data["email"]).first()

    if not user or not verify_password(data["password"], user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"user_id": user.id, "role": user.role})

    return {"access_token": token}