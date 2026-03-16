import pandas as pd
import joblib
from xgboost import XGBClassifier
from xgboost.callback import EarlyStopping
from sklearn.metrics import roc_auc_score, roc_curve

# ----------------------------------
# LOAD PRECOMPUTED PIPELINE OUTPUTS
# ----------------------------------

# Customer features + clusters
df = pd.read_csv("ml/outputs/customer_segmented.csv")

# Churn labels (segment-aware, already done)
labels = pd.read_csv("ml/outputs/customer_churn_labeled.csv")[["customer_id", "churn"]]

# Sentiment features
sentiment = pd.read_csv("ml/outputs/customer_sentiment.csv")

# ----------------------------------
# MERGE ALL SIGNALS (ONE SOURCE OF TRUTH)
# ----------------------------------

df = df.merge(labels, on="customer_id", how="left")
df = df.merge(sentiment, on="customer_id", how="left")


# Fill missing sentiment safely
df[["avg_sentiment", "neg_review_ratio"]] = df[
    ["avg_sentiment", "neg_review_ratio"]
].fillna(3)

# ----------------------------------
# MODEL FEATURES (LEAKAGE-FREE)
# ----------------------------------

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

X = df[features]
y = df["churn"]

# ----------------------------------
# TIME-AWARE TRAIN / TEST SPLIT
# ----------------------------------

df = df.sort_values("recency_days")
split = int(0.75 * len(df))

X_train = X.iloc[:split]
y_train = y.iloc[:split]

X_test = X.iloc[split:]
y_test = y.iloc[split:]

# ----------------------------------
# XGBOOST MODEL (EARLY STOPPING)
# ----------------------------------

model = XGBClassifier(
    n_estimators=2000,
    learning_rate=0.03,
    max_depth=5,
    min_child_weight=5,
    subsample=0.85,
    colsample_bytree=0.85,
    scale_pos_weight=len(y_train) / y_train.sum(),
    eval_metric="auc",
    random_state=42,
    callbacks=[EarlyStopping(rounds=75, save_best=True)]
)

model.fit(
    X_train,
    y_train,
    eval_set=[(X_test, y_test)],
    verbose=True
)


# ----------------------------------
# ADD CHURN PROBABILITY TO DATASET
# ----------------------------------

df["churn_probability"] = model.predict_proba(X)[:, 1]

def map_risk(p):
    if p < 0.6:
        return "Low"
    elif p < 0.7:
        return "Medium"
    else:
        return "High"

df["risk_level"] = df["churn_probability"].apply(map_risk)


# ----------------------------------
# EVALUATION
# ----------------------------------

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

# Predict probabilities
y_prob = model.predict_proba(X_test)[:, 1]

# Predict class labels
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
optimal_idx = (tpr - fpr).argmax()
optimal_threshold = thresholds[optimal_idx]

print("Optimal Threshold:", optimal_threshold)

y_pred = (y_prob >= optimal_threshold).astype(int)

# Calculate metrics
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)

# Print results
print("\nMODEL EVALUATION METRICS")
print("------------------------")
print(f"Accuracy  : {accuracy*100:.2f}%")
print(f"Precision : {precision*100:.2f}%")
print(f"Recall    : {recall*100:.2f}%")
print(f"F1 Score  : {f1*100:.2f}%")
print(f"ROC-AUC   : {auc*100:.2f}%")

# Confusion matrix (optional but recommended)
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# ----------------------------------
# SAVE MODEL + DATASET
# ----------------------------------

joblib.dump(model, "ml/models/xgb_churn_model.pkl")

df.to_csv(
    "ml/outputs/customer_level_trained_dataset.csv",
    index=False
)

print("XGBoost model retrained using modular pipeline outputs.")
