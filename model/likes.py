import json
import pandas as pd
from sklearn.linear_model import LogisticRegression
from pathlib import Path
import json

LIKES = (
    Path(__file__).parent.parent
    / "data"
    / "processed"
    / "airbnb_likes.json"
)


def load_likes():
    if not LIKES.exists():
        return {}

    with open(LIKES) as f:
        rows = json.load(f)

    return {
        str(row["id"]): row["like"]
        for row in rows
    }

# FEATURES = [
#     "rating",
#     "valueScore",
#     "perNight",
#     "bedrooms",
#     "bathrooms",
#     "reviews"
# ]


# def train():

#     listings = pd.read_json(
#     "data/processed/airbnb_medellin_features.json"
# )

#     listings["id"] = listings["id"].astype(str)


#     likes = pd.read_json(
#         LIKES
#     )


#     df = listings.merge(
#         likes,
#         on="id"
#     )


#     X = df[FEATURES]

#     y = (
#         df.like == "YES"
#     ).astype(int)


#     model = LogisticRegression()

#     model.fit(
#         X,
#         y
#     )


#     predictions = listings.copy()


#     predictions["likeProbability"] = (
#         model.predict_proba(
#             listings[FEATURES]
#         )[:,1]
#     )


#     return predictions