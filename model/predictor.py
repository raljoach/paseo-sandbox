import pandas as pd
from pathlib import Path


PREDICTIONS = (
    Path(__file__).parent.parent
    / "data"
    / "processed"
    / "airbnb_predictions.json"
)


def generate_predictions(model, listings):

    predictions = listings.copy()

    features = [
        "rating",
        "valueScore",
        "perNight",
        "bedrooms",
        "bathrooms",
        "reviews",
    ]

    predictions["likeProbability"] = (
        model.predict_proba(
            predictions[features]
        )[:,1]
    )


    predictions["predictedLike"] = (
        predictions["likeProbability"] >= 0.5
    )


    predictions.to_json(
        PREDICTIONS,
        orient="records",
        indent=2
    )


    return predictions