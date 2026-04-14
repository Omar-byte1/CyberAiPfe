from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
import datetime

from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user")

    cti_events = relationship("CTIEvent", back_populates="owner")
    incidents = relationship("Incident", back_populates="owner")


class CTIEvent(Base):
    __tablename__ = "cti_events"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="cti_events")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True)
    type = Column(String)
    verdict = Column(String)
    risk_score = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="incidents")
