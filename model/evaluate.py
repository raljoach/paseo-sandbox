from pathlib import Path

import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

from model.likes import load_likes


FEATURES = (
    Path(__file__).parent.parent
    / "data"
    / "processed"
    / "airbnb_medellin_features.json"
)


def evaluate(model):

    listings = pd.read_json(FEATURES)

    listings["id"] = listings["id"].astype(str)

    likes = load_likes()

    #
    # only evaluate listings the user has labeled
    #

    listings["like"] = (
        listings["id"]
        .map(likes)
    )

    listings = listings[
        listings["like"].notna()
    ].copy()

    print(
        listings["like"].value_counts()
    )

    X = listings[
        [
            "rating",
            "valueScore",
            "perNight",
            "bedrooms",
            "bathrooms",
            "reviews",
        ]
    ]

    y_true = (
        listings["like"] == "YES"
    ).astype(int)

    y_pred = model.predict(X)

    print()
    print("========== MODEL EVALUATION ==========")
    print()

    print(
        "Accuracy :",
        round(accuracy_score(y_true, y_pred), 3)
    )

    print(
        "Precision:",
        round(precision_score(y_true, y_pred), 3)
    )

    print(
        "Recall   :",
        round(recall_score(y_true, y_pred), 3)
    )

    print(
        "F1 Score :",
        round(f1_score(y_true, y_pred), 3)
    )

    print()

    print("Confusion Matrix")

    print(
        confusion_matrix(
            y_true,
            y_pred,
        )
    )

    print()

    print("Feature Importance")

    importance = pd.Series(
        model.coef_[0],
        index=X.columns,
    )

    print(
        importance.sort_values(
            ascending=False
        )
    )