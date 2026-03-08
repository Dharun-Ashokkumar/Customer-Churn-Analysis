import joblib
import os

# Get current file directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to ML models folder
MODEL_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..", "..", "ml", "models")
)

def load_models():

    kmeans_path = os.path.join(MODEL_DIR, "kmeans.pkl")
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    xgb_path = os.path.join(MODEL_DIR, "xgb_churn_model.pkl")

    # Check if files exist
    if not os.path.exists(kmeans_path):
        raise FileNotFoundError(f"KMeans model not found: {kmeans_path}")

    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Scaler not found: {scaler_path}")

    if not os.path.exists(xgb_path):
        raise FileNotFoundError(f"XGBoost model not found: {xgb_path}")

    # Load models
    kmeans = joblib.load(kmeans_path)
    scaler = joblib.load(scaler_path)
    xgb_model = joblib.load(xgb_path)

    print("✅ Models loaded successfully")

    return kmeans, scaler, xgb_model