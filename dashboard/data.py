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
    print("Prediction file:", prediction_file)
    print("Feature file:", feature_file)

    if prediction_file.exists():
        prediction_time = prediction_file.stat().st_mtime
        feature_time = feature_file.stat().st_mtime

        if prediction_time >= feature_time:
            print("Loading predictions: ", prediction_file)
            df = pd.read_json(prediction_file)

        elif feature_file.exists():
            print("Loading newest features: ", feature_file)
            df = pd.read_json(feature_file)

    elif feature_file.exists():
        print("Loading features: ", feature_file)
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
            "monthlyRent",
            "bedrooms",
            "bathrooms",
            "propertyType",
            "city",
            "propertySize",
            "title"#,
            # "isFurnished",
            # "hasParking",
            # "allowsPets",
            # "hasBalcony",
            # "hasElevator",
        ]

    for col in required:

        if col not in df.columns:
            df[col] = None


    print('COLUMNS LOADED: \n', df.columns.tolist())
    print(f"Rows: {len(df)}")
    print()

    for col in [
        "monthlyRent",
        "bedrooms",
        "bathrooms",
        "propertySize",
        "propertyType",
        "city"#,
        # "isFurnished",
        # "hasParking",
        # "allowsPets",
        # "hasBalcony",
        # "hasElevator",
    ]:

        empty = (
            df[col]
            .isna()
            .sum()
        )

        blank = (
            df[col]
            .astype(str)
            .str.strip()
            .eq("")
            .sum()
        )

        total_missing = empty + blank

        print(
            f"{col:15}"
            f"{total_missing:4} missing"
            f" ({100*total_missing/len(df):5.1f}%)"
        )
    return df