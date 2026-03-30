

async def init_db():
    from .models import Base
    from .session import engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
