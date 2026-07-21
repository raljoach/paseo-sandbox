from pathlib import Path
BASE = Path(__file__).parent.parent
DATA = BASE / "data"

def raw_file(prefix):
    return file_path("raw", f"{prefix}_raw")

def features_file(prefix):
    return file_path("processed", f"{prefix}_features")

def clean_file(prefix):
    return file_path("processed", f"{prefix}_clean")

def model_file(prefix):
    return file_path("output", prefix, "joblib")

def likes_file():
    return file_path("user", f"likes")

def rank_file(prefix):
    return file_path("output", f"{prefix}_ranked")

def file_path(
    stage,
    prefix,
    extension="json"
):
    return (
        DATA /
        stage /
        f"{prefix}.{extension}"
    )

def model_exists(prefix):
    return model_file(prefix).exists()