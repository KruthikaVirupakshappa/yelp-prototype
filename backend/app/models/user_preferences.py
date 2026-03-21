from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    cuisine_preferences = Column(Text, nullable=True)  # Comma-separated
    price_range = Column(String(10), nullable=True)  # e.g., "$", "$$"
    dietary_needs = Column(Text, nullable=True)  # e.g., "vegan, gluten-free"
    preferred_location = Column(String(255), nullable=True)
    ambiance_preferences = Column(Text, nullable=True)  # e.g., "romantic, casual"
    sort_preference = Column(String(50), nullable=True)  # e.g., "rating", "distance", "popularity", "price"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="preferences")