from sqlalchemy import Column, Integer, String, Enum, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("user", "owner", name="user_role"), default="user", nullable=False)
    phone = Column(String(20), nullable=True)
    about_me = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(10), nullable=True)
    country = Column(String(100), nullable=True)
    languages = Column(String(255), nullable=True)
    gender = Column(Enum("male", "female", "other", "prefer_not_to_say", name="gender_type"), nullable=True)
    profile_picture = Column(String(500), nullable=True)
    restaurant_location = Column(String(255), nullable=True)  # For owners
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    owned_restaurants = relationship("Restaurant", back_populates="owner", foreign_keys="Restaurant.owner_id")