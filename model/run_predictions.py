import argparse

from dashboard.data import load_dataframe
from model.predictor import generate_predictions
from model.paths import predictions_path

def run_predictions(site, source):
    df = load_dataframe(
        site=site,
        source=source
    )

    predictions = generate_predictions(df)

    output = predictions_path(
        source,
        site
    )

    output.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    predictions.to_json(
        output,
        orient="records",
        indent=2
    )

    print(f"Saved {len(predictions)} predictions to {output}")


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--site",
        required=True
    )

    parser.add_argument(
        "--source",
        required=True
    )

    args = parser.parse_args()

    run_predictions(
        args.site,
        args.source
    )


if __name__ == "__main__":
    main()