from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import AuditSnapshot, Case, User


async def create_case(db: AsyncSession, case_data: dict) -> Case:
    case = Case(
        id=case_data["case_id"],
        event_id=case_data["event"]["event_id"],
        machine_id=case_data["event"]["machine_id"],
        line_id=case_data["event"]["line_id"],
        event_type=case_data["event"]["event_type"],
        severity=case_data["prioritized_case"]["severity"],
        priority_score=case_data["prioritized_case"]["priority_score"],
        confidence=case_data["assessment"]["confidence"],
        recommendation=case_data["decision"]["recommendation"],
        routing_bucket=case_data["prioritized_case"]["routing_bucket"],
        deterministic_hash=case_data["audit"]["deterministic_hash"],
        downtime_avoided_minutes=int(case_data["consequence"]["downtime_avoided_minutes"]),
        cost_estimate_usd=int(case_data["consequence"]["cost_estimate_usd"]),
        risk_level=case_data["consequence"]["risk_level"],
        result_data=case_data,
    )
    db.add(case)
    await db.commit()
    return case


async def get_cases(db: AsyncSession, limit: int = 100) -> list[Case]:
    result = await db.execute(select(Case).order_by(Case.created_at.desc()).limit(limit))
    return list(result.scalars().all())


async def get_case_by_id(db: AsyncSession, case_id: str) -> Case | None:
    result = await db.execute(select(Case).where(Case.id == case_id))
    return result.scalar_one_or_none()


async def create_audit_snapshot(
    db: AsyncSession, case_id: str, stage_name: str, stage_data: dict
) -> AuditSnapshot:
    snapshot = AuditSnapshot(case_id=case_id, stage_name=stage_name, stage_data=stage_data)
    db.add(snapshot)
    await db.commit()
    return snapshot


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, email: str, hashed_password: str) -> User:
    import uuid

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hashed_password,
    )
    db.add(user)
    await db.commit()
    return user
