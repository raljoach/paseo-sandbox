import pandas as pd
from pathlib import Path
from joblib import load
from model.paths import model_file
from model.preprocessing import (
    FEATURES,
    prepare_features,
)


def load_model(listing_type):
    path = model_file(listing_type)
    if not path.exists():
        raise Exception(
            f"""
No model found for listing type:
{listing_type}

Expected:
{path}

Train a model first.
"""
        )

    return load(path)

def classify_probability(p):
    if p >= .80:
        return "YES"

    elif p <= .20:
        return "NO"

    return ""

def generate_predictions(listingType, listings):
    listings = listings.drop(
            columns=[
                "idLink"
            ],
            errors="ignore"
        )

    listings["id"] = listings["id"].astype(str)
    model = load_model(listingType)
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