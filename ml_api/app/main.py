from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd
import os

from .schemas import ChurnRequest
from .model_loader import load_models
from .predictor import get_user_cluster, predict_churn_xgb

app = FastAPI()
# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # DEV ONLY
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analytics_df = None
kmeans = scaler = xgb_model = None

# Global stats variable
data_stats = {}


@app.on_event("startup")
def startup():
    global df_full, kmeans, scaler, xgb_model

    global analytics_df
    analytics_df = pd.read_csv("ml/outputs/analytics_master.csv")

    kmeans, scaler, xgb_model = load_models()


@app.get("/stats")
def get_stats():
    df = analytics_df
    return {
        "total_customers": len(df),
        "churn_rate": round(df["churn"].mean() * 100, 2),
        "retention_rate": round(100 - df["churn"].mean() * 100, 2),
        "avg_customer_value": round(df["avg_order_value"].mean(), 2),
        "high_risk_customers": int((df["churn"] == 1).sum())
    }
    


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



@app.get("/churn/geography")
def geo_churn():
    df = analytics_df
    return df[[
        "customer_id",
        "lat",
        "lng",
        "region",
        "churn_probability"
    ]].to_dict("records")


@app.get("/churn/trend")
def churn_trend():
    df = analytics_df.copy()

    if "date" not in df.columns:
        # fallback: simulate monthly trend
        df["month"] = pd.qcut(
            df.index,
            q=6,
            labels=["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        )
    else:
        df["month"] = pd.to_datetime(df["date"]).dt.month_name()

    return (
        df.groupby("month")
        .churn_probability.mean()
        .reset_index(name="value")
        .to_dict("records")
    )



@app.get("/sentiment/overview")
def sentiment_overview():
    df = analytics_df

    avg_score = round(df["avg_sentiment"].mean(), 2)
    total = len(df)

    return {
        "overallScore": avg_score,
        "totalFeedback": total
    }


@app.get("/sentiment/breakdown")
def sentiment_breakdown():
    df = analytics_df

    labels = pd.cut(
        df["avg_sentiment"],
        bins=[0, 2.5, 3.5, 5],
        labels=["Negative", "Neutral", "Positive"]
    )

    counts = labels.value_counts().reindex(
        ["Positive", "Neutral", "Negative"], fill_value=0
    )

    total = counts.sum()

    colors = {
        "Positive": "#22c55e",
        "Neutral": "#eab308",
        "Negative": "#ef4444"
    }

    result = []
    for k, v in counts.items():
        result.append({
            "name": k,
            "value": round((v / total) * 100, 2),
            "count": int(v),
            "fill": colors[k]
        })

    return result




@app.get("/sentiment/summary")
def sentiment_summary():
    df = analytics_df
    return {
        "avg_sentiment": round(df["avg_sentiment"].mean(), 2),
        "positive_pct": round((df["avg_sentiment"] >= 4).mean()*100,2),
        "neutral_pct": round(((df["avg_sentiment"] >= 3) & (df["avg_sentiment"] < 4)).mean()*100,2),
        "negative_pct": round((df["avg_sentiment"] < 3).mean()*100,2)
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

    # Categorize sentiment
    df["sentiment_label"] = pd.cut(
        df["avg_sentiment"],
        bins=[0, 2.5, 3.5, 5],
        labels=["negative", "neutral", "positive"]
    )

    result = []

    for channel, group in df.groupby("channel"):
        total = len(group)

        result.append({
            "channel": channel,
            "total": total,
            "positive": round((group["sentiment_label"] == "positive").mean() * 100, 2),
            "neutral": round((group["sentiment_label"] == "neutral").mean() * 100, 2),
            "negative": round((group["sentiment_label"] == "negative").mean() * 100, 2),
        })

    return result




@app.get("/sentiment/words")
def sentiment_words():
    # Simple placeholder using complaints / reviews if available
    # Replace with NLP later
    return [
        {"word": "delay", "count": 120},
        {"word": "support", "count": 98},
        {"word": "refund", "count": 75},
        {"word": "quality", "count": 64},
        {"word": "price", "count": 52}
    ]


@app.get("/customers")
def get_all_customers():
    df = analytics_df.copy()

    def risk_label(prob):
        low = settings_store["lowRisk"]
        high = settings_store["highRisk"]

        if prob >= high:
            return "High"
        elif prob >= low:
            return "Medium"
        else:
            return "Low"

    df["risk_level"] = df["churn_probability"].apply(risk_label)

    return df[[
        "customer_id",
        "avg_order_value",
        "avg_delivery_time",
        "avg_rating",
        "churn_probability",
        "risk_level",
        "cluster_id"
    ]].to_dict("records")



from .utils import get_top_features


@app.post("/predict/batch")

def predict_batch(data: List[ChurnRequest]):
    results = []
    for item in data:
        prob, risk = predict_churn_xgb(xgb_model, [
            item.avg_order_value,
            item.avg_delivery_time,
            item.avg_rating,
            item.discount_rate,
            item.value_per_minute,
            item.rating_discount_interaction,
            item.avg_sentiment,
            item.neg_review_ratio,
            0
        ])
        results.append({
            "customer_id": item.customer_id,
            "churn_probability": prob,
            "risk_level": risk
        })
    return results

@app.get("/predict/explain")
def explain_model():
    features = [
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
    return get_top_features(xgb_model, features)

@app.post("/predict/churn")
def churn_prediction(data: ChurnRequest):
    cluster_features = [
        data.avg_order_value,
        data.avg_delivery_time,
        data.avg_rating,
        data.discount_rate,
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
        cluster_id,
    ]

    prob, risk = predict_churn_xgb(xgb_model, xgb_features)

    return {
        "cluster_id": int(cluster_id),
        "churn_probability": float(prob),
        "risk_level": risk,
    }

# ---- SETTINGS (DEMO STORE) ----
settings_store = {
    "lowRisk": 0.3,
    "highRisk": 0.6,
    "emailAlerts": True,
    "weeklyReport": False
}

@app.get("/settings")
def get_settings():
    return settings_store

@app.post("/settings")
def update_settings(payload: dict):
    settings_store.update(payload)
    return {"status": "saved", "settings": settings_store}

