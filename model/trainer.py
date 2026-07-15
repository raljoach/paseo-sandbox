import pandas as pd
from sklearn.linear_model import LogisticRegression
from pathlib import Path
from model.likes import load_likes
from joblib import dump
from model.paths import MODEL_FILE
from model.evaluate import evaluate

from model.preprocessing import (
    FEATURES,
    prepare_features,
)

DATA = (
    Path(__file__).parent.parent
    / "data"
    / "processed"
    / "airbnb_medellin_features.json"
)

MIN_LABELS = 20
MIN_PER_CLASS = 5


def train():
    print('LOADING: ', DATA)
    listings = pd.read_json(DATA)
    listings = prepare_features(listings)
    listings["id"] = (
        listings["id"]
        .astype(str)
    )
    
    likes = pd.DataFrame(
        load_likes().items(),
        columns=[
            "id",
            "like"
        ]
    )



    yes_count = (
        likes["like"] == "YES"
    ).sum()

    no_count = (
        likes["like"] == "NO"
    ).sum()


    if len(likes) < MIN_LABELS:
        print("Not enough labels: ",len(likes), ' minimum: ', MIN_LABELS)
        return None


    if yes_count < MIN_PER_CLASS or no_count < MIN_PER_CLASS:
        print("Need more YES and NO examples: ", yes_count, no_count, ' min per class: ', MIN_PER_CLASS)
        return None

    df = listings.merge(
        likes,
        on="id",
        how="inner",
    )

    if df.empty:
        return None
    
    if len(df) == 0:
        return None

    if df["like"].nunique() < 2:
        return None

    X = df[FEATURES]

    y = (
        df["like"] == "YES"
    ).astype(int)

    model = LogisticRegression(
        class_weight="balanced",
        max_iter=1000
    )
    print("Training labels:")
    print(y.value_counts())

    print()
    print("Feature ranges:")
    print(X.describe())
    model.fit(
        X,
        y
    )
    evaluate(model)
    dump(model, MODEL_FILE)
    return model