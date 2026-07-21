import json;
import pandas as pd
from model.likes import load_likes
from common.metadata import create_prefix


def get_file(input_file):
    contents = json.load(
        open(input_file)
    )
    return contents

def get_metadata(contents):
    return contents["metadata"]
    

def get_listings(contents):
    return pd.DataFrame(
        contents["listings"]
    )

DEFAULT_COLUMNS = {
    "predictedLike": "",
    "likeProbability": None,
}


    
def load_dataframe(input_file):
    contents = get_file(input_file)
    # print(contents)
    listings = get_listings(contents)
    # print(listings)
    print(input_file)
    metadata = get_metadata(contents)
    print(metadata)
    prefix = create_prefix(metadata)


    # #
    # # Load best available dataset
    # #

    # prediction_file = predictions_path(site, source)
    # feature_file = features_path(site, source)
    # print("Prediction file:", prediction_file)
    # print("Feature file:", feature_file)

    # if prediction_file.exists():
    #     prediction_time = prediction_file.stat().st_mtime
    #     feature_time = feature_file.stat().st_mtime

    #     if prediction_time >= feature_time:
    #         print("Loading predictions: ", prediction_file)
    #         df = pd.read_json(prediction_file)

    #     elif feature_file.exists():
    #         print("Loading newest features: ", feature_file)
    #         df = pd.read_json(feature_file)

    # elif feature_file.exists():
    #     print("Loading features: ", feature_file)
    #     df = pd.read_json(feature_file)

    # else:

    #     print(
    #         "New data location not found. "
    #         "Checking legacy paths..."
    #     )

    #     legacy_features = (
    #         Path("data")
    #         / "processed"
    #         / f"{site}_medellin_features.json"
    #     )

    #     legacy_predictions = (
    #         Path("data")
    #         / "processed"
    #         / f"{site}_predictions.json"
    #     )


    #     if legacy_predictions.exists():

    #         print(
    #             f"Loading legacy predictions: {legacy_predictions}"
    #         )

    #         df = pd.read_json(
    #             legacy_predictions
    #         )


    #     elif legacy_features.exists():

    #         print(
    #             f"Loading legacy features: {legacy_features}"
    #         )

    #         df = pd.read_json(
    #             legacy_features
    #         )

    #     else:

    #         raise Exception(
    #             f"No data found for {site}/{source}"
    #         )

    #
    # Normalize IDs
    #

    listings["id"] = listings["id"].astype(str)
    listings["listingId"] = listings["id"].astype(str)
    #
    # UI hyperlink column
    #

    listings["idLink"] = listings.apply(
        lambda r:
            f'[{r["listingId"]}]({r["url"]})',
        axis=1
    )

    #
    # Restore user likes
    #

    likes = load_likes()

    listings["like"] = (
        listings["id"]
        .astype(str)
        .map(
            lambda x: likes.get(x, {}).get("label", "")
        )
        .fillna("")
    )


    #
    # Current Airbnb marker
    #

    listings["is_current"] = False

    # if current_listing:

    #     listings["is_current"] = (
    #         listings["id"]
    #         .astype(str)
    #         ==
    #         str(current_listing)
    #     )


    #
    # Prediction formatting
    #

    if "predictedLike" in listings:

        listings["predictedLike"] = (
            listings["predictedLike"]
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

    if "likeProbability" in listings:

        listings["likeProbability"] = (
            pd.to_numeric(
                listings["likeProbability"],
                errors="coerce"
            )
            .round(2)
        )


    #
    # Derived values
    #

    if (
        "rating" in listings.columns and
        "perNight" in listings.columns
    ):
        listings["core_value"] = (
            listings["rating"] /
            listings["perNight"]
        )
    else:
        listings["core_value"] = None

    for col, default in DEFAULT_COLUMNS.items():
        if col not in listings.columns:
            listings[col] = default
    #
    # Ensure columns exist
    #

    FEATURE_REQUIREMENTS = {
        "short-term-stay": [
            "nightlyRent",
            "rating",
            "reviewCount",
            "bedrooms",
            "bathrooms",
            "propertyType",
            "amenities",
            "predictedLike",
            "likeProbability"
        ],
        "long-term-stay": [
            "monthlyRent",
            "bedrooms",
            "bathrooms",
            "propertySize",
            "propertyType",
            "predictedLike",
            "likeProbability"
        ]
    }
    required = FEATURE_REQUIREMENTS[
        metadata["listingType"]
    ]
    for col in required:
        if col not in listings.columns:
            listings[col] = None


    print('COLUMNS LOADED: \n', listings.columns.tolist())
    print(f"Rows: {len(listings)}")
    print()

    diagnostic_columns = [
        "monthlyRent",
        "nightlyRent",
        "bedrooms",
        "bathrooms",
        "propertySize",
        "propertyType",
        "city",
        "rating",
        "reviewCount"
    ]


    for col in diagnostic_columns:

        if col not in listings.columns:
            continue

        empty = (
            listings[col]
            .isna()
            .sum()
        )

        blank = (
            listings[col]
            .astype(str)
            .str.strip()
            .eq("")
            .sum()
        )

        total_missing = empty + blank

        print(
            f"{col:15}"
            f"{total_missing:4} missing"
            f" ({100*total_missing/len(listings):5.1f}%)"
        )
    return prefix, metadata, listings