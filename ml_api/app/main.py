from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sqlalchemy import text

from .schemas import ChurnRequest
from .model_loader import load_models
from .predictor import get_user_cluster, predict_churn_xgb
from .database import engine
from .utils import get_top_features
from .explainability import get_shap_values

app = FastAPI()

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analytics_df = None
kmeans = scaler = xgb_model = None

def get_analytics_data():
    query = "SELECT * FROM analytics"
    return pd.read_sql(query, engine)

# -----------------------------
# STARTUP
# -----------------------------
@app.on_event("startup")
def startup():
    global analytics_df, kmeans, scaler, xgb_model

    analytics_df = get_analytics_data()
    kmeans, scaler, xgb_model = load_models()

# -----------------------------
# STATS
# -----------------------------
@app.get("/stats")
def get_stats():
    df = get_analytics_data()

    return {
        "total_customers": len(df),
        "churn_rate": round(df["churn"].mean() * 100, 2),
        "retention_rate": round(100 - df["churn"].mean() * 100, 2),
        "avg_customer_value": round(df["avg_order_value"].mean(), 2),
        "high_risk_customers": int((df["churn"] == 1).sum())
    }

# -----------------------------
# CHURN DISTRIBUTION
# -----------------------------
@app.get("/churn/distribution")
def churn_distribution():

    df = analytics_df.copy()

    bins = [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0]
    labels = [
        "0–10%", "10–20%", "20–30%", "30–40%", "40–50%",
        "50–60%", "60–70%", "70–80%", "80–90%", "90–100%"
    ]

    df["bucket"] = pd.cut(
        df["churn_probability"],
        bins=bins,
        labels=labels,
        include_lowest=True
    )

    result = (
        df.groupby("bucket", observed=True)
        .size()
        .reset_index(name="count")
    )

    return result.to_dict("records")

# -----------------------------
# SEGMENTS
# -----------------------------
@app.get("/churn/segments")
def segment_analysis():

    df = analytics_df

    return (
        df.groupby("cluster_id")
        .agg(
            customers=("customer_id","count"),
            avg_risk=("churn_probability","mean")
        )
        .reset_index()
        .to_dict("records")
    )

# -----------------------------
# HIGH RISK
# -----------------------------
@app.get("/churn/high-risk")
def high_risk_customers():

    df = analytics_df.copy()

    high = df.sort_values(
        "churn_probability",
        ascending=False
    ).head(20)

    return high[[
        "customer_id",
        "avg_order_value",
        "avg_rating",
        "churn_probability",
        "cluster_id"
    ]].to_dict("records")

# -----------------------------
# GEOGRAPHY
# -----------------------------
@app.get("/churn/geography")
def geo_churn():
    from sqlalchemy import text

    query = text("""
        SELECT
            customer_id,
            lat,
            lng,
            churn_probability,
            risk_level
        FROM analytics
        WHERE lat IS NOT NULL AND lng IS NOT NULL
    """)

    with engine.connect() as conn:
        result = conn.execute(query)

        rows = [
            {
                "customer_id": row.customer_id,
                "lat": float(row.lat),
                "lng": float(row.lng),
                "churn_probability": float(row.churn_probability),
                "risk_level": row.risk_level
            }
            for row in result
        ]

    return rows
# -----------------------------
# CHURN TREND
# -----------------------------
@app.get("/churn/trend")
def churn_trend():

    df = analytics_df.copy()

    # ✅ Ensure proper datetime
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # ❗ Drop invalid dates
    df = df.dropna(subset=["date"])

    # ✅ Sort by date
    df = df.sort_values("date")

    # ✅ Group by date (or month if needed)
    trend = (
        df.groupby(df["date"].dt.date)["churn_probability"]
        .mean()
        .reset_index()
    )

    # ✅ Rename for frontend
    trend.columns = ["date", "value"]

    return trend.to_dict("records")

# -----------------------------
# SENTIMENT
# -----------------------------
@app.get("/sentiment/summary")
def sentiment_summary():

    df = analytics_df

    return {
        "avg_sentiment": round(df["avg_sentiment"].mean(),2),
        "positive_pct": round((df["avg_sentiment"]>=4).mean()*100,2),
        "neutral_pct": round(((df["avg_sentiment"]>=3)&(df["avg_sentiment"]<4)).mean()*100,2),
        "negative_pct": round((df["avg_sentiment"]<3).mean()*100,2)
    }

@app.get("/sentiment/trends")
def sentiment_trends():

    df = analytics_df.copy()

    df["sentiment_label"] = pd.cut(
        df["avg_sentiment"],
        bins=[0,2.5,3.5,5],
        labels=["Negative","Neutral","Positive"]
    )

    trend = (
        df.groupby("sentiment_label")
        .size()
        .reset_index(name="count")
    )

    return trend.to_dict("records")

@app.get("/sentiment/channels")
def sentiment_by_channel():

    df = analytics_df.copy()

    df["sentiment_label"] = pd.cut(
        df["avg_sentiment"],
        bins=[0,2.5,3.5,5],
        labels=["negative","neutral","positive"]
    )

    result = []

    for channel, group in df.groupby("channel"):

        total = len(group)

        result.append({
            "channel": channel,
            "total": total,
            "positive": round((group["sentiment_label"]=="positive").mean()*100,2),
            "neutral": round((group["sentiment_label"]=="neutral").mean()*100,2),
            "negative": round((group["sentiment_label"]=="negative").mean()*100,2)
        })

    return result

@app.get("/sentiment/words")
def sentiment_words():

    return [
        {"word":"delay","count":120},
        {"word":"support","count":98},
        {"word":"refund","count":75},
        {"word":"quality","count":64},
        {"word":"price","count":52}
    ]

# -----------------------------
# CUSTOMERS
# -----------------------------
@app.get("/customers")
def get_all_customers():

    df = analytics_df.copy()

    df["risk_level"] = pd.cut(
        df["churn_probability"],
        bins=[0,0.6,0.7,0.8],
        labels=["Low","Medium","High"]
    )

    return df[[
        "customer_id",
        "avg_order_value",
        "avg_delivery_time",
        "avg_rating",
        "churn_probability",
        "risk_level",
        "cluster_id"
    ]].to_dict("records")

# -----------------------------
# BATCH PREDICTION
# -----------------------------
@app.post("/predict/batch")
def predict_batch(data: List[ChurnRequest]):

    results = []

    for item in data:

        prob, risk = predict_churn_xgb(
            xgb_model,
            [
                item.avg_order_value,
                item.avg_delivery_time,
                item.avg_rating,
                item.discount_rate,
                item.value_per_minute,
                item.rating_discount_interaction,
                item.avg_sentiment,
                item.neg_review_ratio,
                0
            ]
        )

        results.append({
            "customer_id": item.customer_id,
            "churn_probability": prob,
            "risk_level": risk
        })

    return results

# -----------------------------
# MAIN PREDICT
# -----------------------------
@app.post("/predict/churn")
def churn_prediction(data: ChurnRequest):

    cluster_features = [
        data.avg_order_value,
        data.avg_delivery_time,
        data.avg_rating,
        data.discount_rate
    ]

    cluster_id = get_user_cluster(cluster_features, kmeans, scaler)

    xgb_features = [
        data.avg_order_value,
        data.avg_delivery_time,
        data.avg_rating,
        data.discount_rate,
        data.value_per_minute,
        data.rating_discount_interaction,
        data.avg_sentiment,
        data.neg_review_ratio,
        cluster_id
    ]

    prob, risk = predict_churn_xgb(xgb_model, xgb_features)

    query = text("""
    INSERT INTO predictions
    (
        avg_order_value,
        avg_delivery_time,
        avg_rating,
        discount_rate,
        churn_probability,
        risk_level,
        cluster_id
    )
    VALUES
    (
        :avg_order_value,
        :avg_delivery_time,
        :avg_rating,
        :discount_rate,
        :churn_probability,
        :risk_level,
        :cluster_id
    )
    """)

    with engine.connect() as conn:

        conn.execute(query,{
            "avg_order_value":data.avg_order_value,
            "avg_delivery_time":data.avg_delivery_time,
            "avg_rating":data.avg_rating,
            "discount_rate":data.discount_rate,
            "churn_probability":float(prob),
            "risk_level":risk,
            "cluster_id":int(cluster_id)
        })

        conn.commit()

    return {
        "cluster_id":int(cluster_id),
        "churn_probability":float(prob),
        "risk_level":risk
    }

# -----------------------------
# EXPLAINABILITY
# -----------------------------
@app.post("/predict/explain")
def explain_prediction(data: ChurnRequest):

    feature_names = [
        "avg_order_value",
        "avg_delivery_time",
        "avg_rating",
        "discount_rate",
        "value_per_minute",
        "rating_discount_interaction",
        "avg_sentiment",
        "neg_review_ratio",
        "cluster_id"
    ]

    cluster_features = [
        data.avg_order_value,
        data.avg_delivery_time,
        data.avg_rating,
        data.discount_rate
    ]

    cluster_id = get_user_cluster(cluster_features, kmeans, scaler)

    features = [
        data.avg_order_value,
        data.avg_delivery_time,
        data.avg_rating,
        data.discount_rate,
        data.value_per_minute,
        data.rating_discount_interaction,
        data.avg_sentiment,
        data.neg_review_ratio,
        cluster_id
    ]

    shap_results = get_shap_values(
        xgb_model,
        features,
        feature_names
    )

    return {
        "cluster_id": int(cluster_id),
        "feature_impacts": shap_results
    }

# -----------------------------
# SETTINGS
# -----------------------------
settings_store = {
    "lowRisk":0.6,
    "highRisk":0.7,
    "emailAlerts":True,
    "weeklyReport":False
}

@app.get("/settings")
def get_settings():
    return settings_store

@app.post("/settings")
def update_settings(payload:dict):
    settings_store.update(payload)
    return {"status":"saved","settings":settings_store}
# -----------------------------
# PREDICTION HISTORY
# -----------------------------
@app.get("/predictions/history")
def prediction_history():

    query = text("""
    SELECT
        avg_order_value,
        avg_delivery_time,
        avg_rating,
        churn_probability,
        risk_level,
        cluster_id
    FROM predictions
    ORDER BY id DESC
    LIMIT 10
    """)

    with engine.connect() as conn:

        result = conn.execute(query)

        rows = [
            dict(row._mapping)
            for row in result
        ]

    return rows

    # -----------------------------
# REGISTER USER
# -----------------------------
@app.post("/auth/register")
def register_user(payload: dict):

    username = payload.get("username")
    password = payload.get("password")

    query = text("""
    INSERT INTO users (username,password)
    VALUES (:username,:password)
    """)

    with engine.connect() as conn:

        conn.execute(query,{
            "username":username,
            "password":password
        })

        conn.commit()

    return {"status":"user_created"}

# -----------------------------
# LOGIN USER
# -----------------------------
@app.post("/auth/login")
def login_user(payload: dict):

    username = payload.get("username")
    password = payload.get("password")

    query = text("""
    SELECT * FROM users
    WHERE username=:username
    AND password=:password
    """)

    with engine.connect() as conn:

        result = conn.execute(query,{
            "username":username,
            "password":password
        }).fetchone()

    if result:
        return {"status":"success"}

    return {"status":"invalid_credentials"}