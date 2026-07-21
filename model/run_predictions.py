from dashboard.data import load_dataframe
from model.predictor import generate_predictions
from model.paths import file_path, model_exists

def run_predictions(input_file):
    prefix, metadata, listings = load_dataframe(
        input_file
    )
    listingType = metadata['listingType']
    if not model_exists(listingType):
        print(
            f"No model found for {listingType}. "
            "Skipping prediction."
        )
        return None
    predictions = generate_predictions(metadata, listings)
    predictions_file = file_path(
        "predictions",
        prefix
    )

    predictions_file.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    predictions.to_json(
        predictions_file,
        orient="records",
        indent=2
    )

    print(f"Saved {len(predictions)} predictions to {predictions_file}")
    return predictions_file