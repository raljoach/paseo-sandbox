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

        prediction_time = PREDICTIONS.stat().st_mtime
        feature_time = FEATURES.stat().st_mtime

        if prediction_time >= feature_time:
            print("Loading predictions")
            df = pd.read_json(PREDICTIONS)

        else:
            print("Loading newest features")
            df = pd.read_json(FEATURES)

    else:

        print("Loading features")
        df = pd.read_json(FEATURES)


    #
    # Normalize IDs
    #

    df["id"] = df["id"].astype(str)
    df["listingId"] = df["id"].astype(str)
    #
    # UI hyperlink column
    #

    df["idLink"] = df.apply(
        lambda r:
            f'[{r["listingId"]}]({r["url"]})',
        axis=1
    )

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
            .astype(str)
            .str.upper()
            .replace({
                "TRUE": "YES",
                "FALSE": "NO",
                "1": "YES",
                "0": "NO",
                "NAN": ""
            })
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


    for col in required:

        if col not in df.columns:
            df[col] = None


    return df