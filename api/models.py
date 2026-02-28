from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from databases import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    phone = Column(String)
    role = Column(String, nullable=False)

    profile = relationship("ThalassemiaProfile", back_populates="users", uselist=False)

class ThalassemiaProfile(Base):
    __tablename__ = "thalassemia_profiles"

    id = Column(Integer, primary_key= True)
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String)
    age = Column(Integer)
    blood_group = Column(String)
    last_transfusion = Column(Date)
    transfusion_interval_days = Column(Integer)
    next_due_date = Column(Date)
    city = Column(String)

    user = relationship("User", back_populates="profile")