from pathlib import Path

BASE = Path(__file__).parent.parent

DATA = BASE / "data"


def rent_path(
    source,
    site,
    artifact
):
    return (
        DATA
        / "rent"
        / source
        / site
        / artifact
    )


def features_path(site, source):
    return (
        DATA
        / "rent"
        / source
        / site
        / f"{site}_features.json"
    )

def predictions_path(site, source):
    return (
        DATA
        / "rent"
        / source
        / site
        / f"{site}_predictions.json"
    )

def raw_path(site, source):
    return (
        DATA
        / "rent"
        / source
        / site
        / f"{site}_raw.json"
    )

def clean_path(site, source):
    return (
        DATA
        / "rent"
        / source
        / site
        / f"{site}_clean.json"
    )

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


def model_exists():
    return MODEL_FILE.exists()