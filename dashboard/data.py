import pandas as pd
from pathlib import Path

from model.likes import load_likes


BASE = Path(__file__).parent.parent


PREDICTIONS = (
    BASE
    / "data"
    / "processed"
    / "airbnb_predictions.json"
)

FEATURES = (
    BASE
    / "data"
    / "processed"
    / "airbnb_medellin_features.json"
)


def load_dataframe(current_airbnb=None):

    #
    # Load best available dataset
    #

    if PREDICTIONS.exists():
        print("Loading predictions")
        df = pd.read_json(PREDICTIONS)

    else:
        print("No predictions found. Loading features")

        df = pd.read_json(FEATURES)

        df["likeProbability"] = None
        df["predictedLike"] = None


    #
    # Normalize IDs
    #

    df["id"] = df["id"].astype(str)


    #
    # Restore user likes
    #

    likes = load_likes()

    df["like"] = (
        df["id"]
        .map(likes)
        .fillna("")
    )


    #
    # Current Airbnb marker
    #

    df["is_current"] = False

    if current_airbnb:

        df["is_current"] = (
            df["id"]
            .astype(str)
            ==
            str(current_airbnb)
        )


    #
    # Prediction formatting
    #

    if "predictedLike" in df:

        df["predictedLike"] = (
            df["predictedLike"]
            .map({
                True: "YES",
                False: ""
            })
            .fillna("")
        )


    if "likeProbability" in df:

        df["likeProbability"] = (
            pd.to_numeric(
                df["likeProbability"],
                errors="coerce"
            )
            .round(2)
        )


    #
    # Derived values
    #

    df["core_value"] = (
        df["rating"]
        /
        df["perNight"]
    )


    #
    # Ensure columns exist
    #

    required = [
        "listingId",
        "url",
        "description",
        "rating",
        "reviews",
        "perNight",
        "bedrooms",
        "bathrooms",
        "ratingBucket",
        "valueScore",
        "predictedLike",
        "likeProbability",
    ]


    df["listingId"] = df["id"]


    for col in required:

        if col not in df.columns:
            df[col] = None


    return df