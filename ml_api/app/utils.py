def get_top_features(model, feature_names, top_n=3):

    # Some models may not have feature_importances_
    if not hasattr(model, "feature_importances_"):
        return []

    importances = model.feature_importances_

    ranked = sorted(
        zip(feature_names, importances),
        key=lambda x: x[1],
        reverse=True
    )

    return [feature for feature, _ in ranked[:top_n]]