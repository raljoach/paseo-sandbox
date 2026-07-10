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


def load_dataframe():

    if PREDICTIONS.exists():
        print("Loading predictions")
        df = pd.read_json(PREDICTIONS)

    else:
        print("Loading features")
        df = pd.read_json(FEATURES)

        df["likeProbability"] = None
        df["predictedLike"] = None


    df["id"] = df["id"].astype(str)

    df["listingId"] = df["id"]


    likes = load_likes()

    df["like"] = (
        df["id"]
        .map(likes)
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


    if "predictedLike" in df:
        df["predictedLike"] = (
            df["predictedLike"]
            .map({
                True: "YES",
                False: "",
            })
            .fillna("")
    )

    df["id"] = df.apply(
        lambda r: f"[{r['listingId']}]({r['url']})",
        axis=1,
    )

    columns = [
        "listingId",
        "url",
        "like",
        "id",
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


    for col in columns:
        if col not in df:
            df[col] = None


    df = df[columns]

    df["core_value"] = (
        df["rating"] /
        df["perNight"]
    )

    return df