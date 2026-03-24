from sqlalchemy import create_engine

# PostgreSQL connection
DATABASE_URL = "postgresql://postgres:1234@localhost:5432/churn_db"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)