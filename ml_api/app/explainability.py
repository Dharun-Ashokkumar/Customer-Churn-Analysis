import shap
import numpy as np

def get_shap_values(model, features, feature_names):

    # Convert input to array
    features_array = np.array(features).reshape(1, -1)

    # Create SHAP explainer
    explainer = shap.TreeExplainer(model)

    shap_values = explainer.shap_values(features_array)

    results = []

    for name, value in zip(feature_names, shap_values[0]):
        results.append({
            "feature": name,
            "impact": float(value)
        })

    # Sort by importance
    results = sorted(results, key=lambda x: abs(x["impact"]), reverse=True)

    return results