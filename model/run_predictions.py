from dashboard.data import load_dataframe
from model.predictor import generate_predictions
from model.paths import PREDICTIONS

def main():

    df = load_dataframe()

    predictions = generate_predictions(df)

    predictions.to_json(
        PREDICTIONS,
        orient="records",
        indent=2
    )

    print(f"Saved {len(predictions)} predictions")


if __name__ == "__main__":
    main()