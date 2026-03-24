import pandas as pd
import os
from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:1234@localhost:5432/churn_db"
engine = create_engine(DATABASE_URL)

# ✅ Get correct file path dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

file_path = os.path.join(BASE_DIR, "analytics_master.csv")

print("Reading file from:", file_path)  # debug

df = pd.read_csv(file_path)

df.to_sql(
    "analytics",
    engine,
    if_exists="append",
    index=False
)

print("✅ Data loaded successfully!")