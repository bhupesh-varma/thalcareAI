from passlib.context import CryptContext
from jose import jwt 
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bycrypt"], deprecated="auto")

def hash_password(password:str):
    return pwd_context.hash(password)

def verify_password(password, hashed):
    return pwd_context.verify(password, hashed)

def create_token(data:dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode, SECRET_KEY, ALGORITHM)