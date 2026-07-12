from model.trainer import train
from model.predictor import generate_predictions
from dashboard.data import load_dataframe


model = train()

df = load_dataframe()

predictions = generate_predictions(
    model,
    df
)

predictions.to_json(
    "data/processed/airbnb_predictions.json",
    orient="records",
    indent=2
)

print(
    f"Saved {len(predictions)} predictions"
)