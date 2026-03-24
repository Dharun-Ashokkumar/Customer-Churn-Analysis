import pandas as pd
import os
from sqlalchemy import create_engine

DATABASE_URL = "postgresql://churn_db_l7n0_user:LI2cmV0u1tI0KhHx5dXA9l6tOLs1eDLO@dpg-d71a787diees73et89eg-a.oregon-postgres.render.com/churn_db_l7n0"

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"}
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(BASE_DIR, "analytics_master.csv")

print("Reading file from:", file_path)

df = pd.read_csv(file_path)

df.to_sql(
    "analytics",     # table name
    engine,
    if_exists="append",  # or "replace" if first time
    index=False
)

print("✅ Data loaded successfully!")