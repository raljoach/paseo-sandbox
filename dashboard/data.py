import pandas as pd
from pathlib import Path
from model.likes import load_likes
from model.paths import (predictions_path, features_path)

def load_dataframe(
    site="airbnb",
    source="short-term",
    current_listing=None
):
    #
    # Load best available dataset
    #

    prediction_file = predictions_path(site, source)
    feature_file = features_path(site, source)

    if prediction_file.exists():
        prediction_time = prediction_file.stat().st_mtime
        feature_time = feature_file.stat().st_mtime

        if prediction_time >= feature_time:
            print("Loading predictions")
            df = pd.read_json(prediction_file)

        elif feature_file.exists():
            print("Loading newest features")
            df = pd.read_json(feature_file)

    elif feature_file.exists():
        print("Loading features")
        df = pd.read_json(feature_file)

    else:

        print(
            "New data location not found. "
            "Checking legacy paths..."
        )

        legacy_features = (
            Path("data")
            / "processed"
            / f"{site}_medellin_features.json"
        )

        legacy_predictions = (
            Path("data")
            / "processed"
            / f"{site}_predictions.json"
        )


        if legacy_predictions.exists():

            print(
                f"Loading legacy predictions: {legacy_predictions}"
            )

            df = pd.read_json(
                legacy_predictions
            )


        elif legacy_features.exists():

            print(
                f"Loading legacy features: {legacy_features}"
            )

            df = pd.read_json(
                legacy_features
            )

        else:

            raise Exception(
                f"No data found for {site}/{source}"
            )

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

    if current_listing:

        df["is_current"] = (
            df["id"]
            .astype(str)
            ==
            str(current_listing)
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

    if (
        "rating" in df.columns and
        "perNight" in df.columns
    ):
        df["core_value"] = (
            df["rating"] /
            df["perNight"]
        )
    else:
        df["core_value"] = None


    #
    # Ensure columns exist
    #

    if site == "airbnb":
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
    else:
        required = [
            "listingId",
            "url",
            "title",
            "monthlyRent",
            "bedrooms",
            "bathrooms",
            "propertyType",
            "city",
            "propertySize",
            "predictedLike",
            "likeProbability",
        ]

    for col in required:

        if col not in df.columns:
            df[col] = None


    return df