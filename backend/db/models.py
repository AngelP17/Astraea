from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True)
    event_id = Column(String, nullable=False)
    machine_id = Column(String)
    line_id = Column(String)
    event_type = Column(String)
    severity = Column(String)
    priority_score = Column(Float)
    confidence = Column(Float)
    recommendation = Column(String)
    routing_bucket = Column(String)
    deterministic_hash = Column(String)
    downtime_avoided_minutes = Column(Integer)
    cost_estimate_usd = Column(Integer)
    risk_level = Column(String)
    result_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditSnapshot(Base):
    __tablename__ = "audit_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, nullable=False)
    stage_name = Column(String)
    stage_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
