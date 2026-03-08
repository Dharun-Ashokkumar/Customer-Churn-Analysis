import numpy as np


# -----------------------------------
# KMEANS CLUSTER PREDICTION
# -----------------------------------
def get_user_cluster(features, kmeans, scaler):

    features = np.array(features, dtype=float).reshape(1, -1)

    # scale features
    scaled_features = scaler.transform(features)

    # predict cluster
    cluster_id = kmeans.predict(scaled_features)[0]

    return int(cluster_id)


# -----------------------------------
# XGBOOST CHURN PREDICTION
# -----------------------------------
def predict_churn_xgb(model, features):

    features = np.array(features, dtype=float).reshape(1, -1)

    # probability of churn
    prob = float(model.predict_proba(features)[0][1])

    # risk label
    if prob < 0.3:
        risk = "Low"
    elif prob < 0.6:
        risk = "Medium"
    else:
        risk = "High"

    return round(prob, 4), risk