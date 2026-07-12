# model/paths.py

from pathlib import Path

BASE = Path(__file__).parent.parent

MODEL_FILE = (
    BASE
    / "data"
    / "processed"
    / "airbnb_model.joblib"
)

LIKES = (
    BASE
    / "data"
    / "processed"
    / "airbnb_likes.json"
)


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

PREDICTIONS = (
    BASE
    / "data"
    / "processed"
    / "airbnb_predictions.json"
)

def model_exists():
    return MODEL_FILE.exists()