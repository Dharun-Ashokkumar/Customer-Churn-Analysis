import streamlit as st
import pandas as pd
from sqlalchemy import create_engine
import plotly.express as px
from streamlit_autorefresh import st_autorefresh
import requests
# -----------------------------
# PAGE CONFIG
# -----------------------------
st.set_page_config(
    page_title="Customer Churn Dashboard",
    layout="wide"
)

st.title("📊 Food Delivery Customer Churn Dashboard")
st_autorefresh(interval=5000, key="datarefresh")

# -----------------------------
# DATABASE CONNECTION
# -----------------------------
DATABASE_URL = "postgresql://postgres:12345@localhost:5432/churn_db"

engine = create_engine(DATABASE_URL)

# -----------------------------
# LOAD DATA
# -----------------------------
@st.cache_data(ttl=5)
def load_data():

    query = "SELECT * FROM predictions"

    df = pd.read_sql(query, engine)

    return df

df = load_data()

# -----------------------------
# NO DATA CHECK
# -----------------------------
if df.empty:

    st.warning("No prediction data found in database.")

    st.info("Run API predictions first to populate the database.")

    st.stop()

# -----------------------------
# KPIs
# -----------------------------
col1, col2, col3 = st.columns(3)

col1.metric(
    "Total Predictions",
    len(df)
)

col2.metric(
    "Average Churn Probability",
    round(df["churn_probability"].mean(), 2)
)

col3.metric(
    "High Risk Customers",
    len(df[df["risk_level"] == "High"])
)

st.divider()

# -----------------------------
# CHURN DISTRIBUTION
# -----------------------------
st.subheader("Churn Probability Distribution")

fig = px.histogram(
    df,
    x="churn_probability",
    nbins=20,
    title="Churn Probability Distribution"
)

st.plotly_chart(fig, use_container_width=True)

# -----------------------------
# RISK LEVEL BREAKDOWN
# -----------------------------
st.subheader("Customer Risk Levels")

risk_counts = df["risk_level"].value_counts().reset_index()

risk_counts.columns = ["risk_level", "count"]

fig2 = px.pie(
    risk_counts,
    values="count",
    names="risk_level",
    title="Risk Level Distribution"
)

st.plotly_chart(fig2, use_container_width=True)

# -----------------------------
# TABLE VIEW
# -----------------------------
st.subheader("Prediction Records")

st.dataframe(df, use_container_width=True)
st.divider()
st.subheader("🔍 Model Feature Importance (SHAP Explainability)")

# Sample customer input for explanation
sample_payload = {
    "customer_id": 1,
    "avg_order_value": 450,
    "avg_delivery_time": 30,
    "avg_rating": 4.3,
    "discount_rate": 0.2,
    "value_per_minute": 15,
    "rating_discount_interaction": 0.86,
    "avg_sentiment": 4,
    "neg_review_ratio": 0.1
}

try:

    response = requests.post(
        "http://127.0.0.1:8000/predict/explain",
        json=sample_payload
    )

    data = response.json()

    features = [f["feature"] for f in data["feature_impacts"]]
    impacts = [f["impact"] for f in data["feature_impacts"]]

    importance_df = pd.DataFrame({
        "feature": features,
        "impact": impacts
    })

    fig = px.bar(
        importance_df,
        x="impact",
        y="feature",
        orientation="h",
        title="Top Features Influencing Churn"
    )

    st.plotly_chart(fig, use_container_width=True)

except:
    st.warning("Explainability API not available.")
    st.divider()
st.subheader("🧠 Predict Customer Churn")

with st.form("prediction_form"):

    col1, col2 = st.columns(2)

    avg_order_value = col1.number_input("Average Order Value", value=400.0)
    avg_delivery_time = col1.number_input("Average Delivery Time", value=30.0)
    avg_rating = col1.number_input("Average Rating", value=4.0)

    discount_rate = col2.number_input("Discount Rate", value=0.2)
    value_per_minute = col2.number_input("Value Per Minute", value=15.0)
    rating_discount_interaction = col2.number_input("Rating Discount Interaction", value=0.8)

    avg_sentiment = st.number_input("Average Sentiment Score", value=4.0)
    neg_review_ratio = st.number_input("Negative Review Ratio", value=0.1)

    submit = st.form_submit_button("Predict Churn")

if submit:

    payload = {
        "customer_id": 999,
        "avg_order_value": avg_order_value,
        "avg_delivery_time": avg_delivery_time,
        "avg_rating": avg_rating,
        "discount_rate": discount_rate,
        "value_per_minute": value_per_minute,
        "rating_discount_interaction": rating_discount_interaction,
        "avg_sentiment": avg_sentiment,
        "neg_review_ratio": neg_review_ratio
    }

    try:

        response = requests.post(
            "http://127.0.0.1:8000/predict/churn",
            json=payload
        )

        result = response.json()

        st.success("Prediction Completed")

        st.metric(
            "Churn Probability",
            result["churn_probability"]
        )

        st.metric(
            "Risk Level",
            result["risk_level"]
        )

        st.write("Customer Cluster:", result["cluster_id"])

    except:

        st.error("API connection failed.")
        st.divider()
st.subheader("👥 Customer Segmentation (KMeans Clusters)")

try:

    # Load prediction data
    cluster_df = df.copy()

    if "cluster_id" in cluster_df.columns:

        cluster_counts = (
            cluster_df.groupby("cluster_id")
            .size()
            .reset_index(name="customers")
        )

        fig_cluster = px.bar(
            cluster_counts,
            x="cluster_id",
            y="customers",
            title="Customer Segments by Cluster",
            labels={
                "cluster_id": "Customer Cluster",
                "customers": "Number of Customers"
            }
        )

        st.plotly_chart(fig_cluster, use_container_width=True)

    else:

        st.warning("Cluster data not available.")

except:
    st.warning("Cluster visualization failed.")
    st.subheader("⚠️ Churn Risk by Customer Segment")

try:

    risk_cluster = (
        df.groupby("cluster_id")["churn_probability"]
        .mean()
        .reset_index()
    )

    fig_risk = px.bar(
        risk_cluster,
        x="cluster_id",
        y="churn_probability",
        title="Average Churn Probability per Cluster",
        labels={
            "cluster_id": "Customer Cluster",
            "churn_probability": "Avg Churn Risk"
        }
    )

    st.plotly_chart(fig_risk, use_container_width=True)

except:
    st.warning("Cluster risk analysis unavailable.")
