import pandas as pd
from sklearn.linear_model import LogisticRegression
from pathlib import Path
from model.likes import load_likes

FEATURES = [
    "rating",
    "valueScore",
    "perNight",
    "bedrooms",
    "bathrooms",
    "reviews",
]

DATA = (
    Path(__file__).parent.parent
    / "data"
    / "processed"
    / "airbnb_medellin_features.json"
)


def train():

    listings = pd.read_json(DATA)

    listings["id"] = (
        listings["id"]
        .astype(str)
    )

    listings["bedrooms"] = (
        listings["bedrooms"]
        .fillna(0)
    )

    listings["bathrooms"] = (
        listings["bathrooms"]
        .fillna(0)
    )

    likes = pd.DataFrame(
        load_likes().items(),
        columns=[
            "id",
            "like"
        ]
    )

    df = listings.merge(
        likes,
        on="id",
        how="inner",
    )

    X = df[FEATURES]

    y = (
        df["like"] == "YES"
    ).astype(int)

    model = LogisticRegression()

    model.fit(
        X,
        y
    )

    return model