import pandas as pd
from pathlib import Path
from model.preprocessing import (
    FEATURES,
    prepare_features,
)

PREDICTIONS = (
    Path(__file__).parent.parent
    / "data"
    / "processed"
    / "airbnb_predictions.json"
)

def classify_probability(p):

    if p >= .80:
        return "YES"

    elif p <= .20:
        return "NO"

    return ""

def generate_predictions(model, listings):
    predictions = listings.copy()

    features_df = prepare_features(listings)

    predictions["id"] = (
        predictions["id"]
        .astype(str)
    )
    predictions["likeProbability"] = (
        model.predict_proba(
            features_df[FEATURES]
        )[:,1]
    )

    predictions["predictedLike"] = (
        predictions["likeProbability"]
        .apply(classify_probability)
    )

    return predictions