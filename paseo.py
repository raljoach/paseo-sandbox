import argparse
import subprocess
from pathlib import Path
import sys
import webbrowser
import time


def run_dashboard():

    print("Starting dashboard...")

    subprocess.Popen(
        [
            sys.executable,
            "-m",
            "dashboard.app"
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    time.sleep(3)

    webbrowser.open(
        "http://127.0.0.1:8050"
    )

    print("Dashboard running.")

def run_scraper(args):
    root = Path(__file__).resolve().parent
    subprocess.run(
        [
            "node",
            "extractors/airbnb/browser.js",
            args.destination,
            args.checkin,
            args.checkout,
            str(args.flex),
        ],
        cwd=root,
        check=True,
    )

def run_predictions():
    subprocess.run(
        [
            sys.executable,
            "-m",
            "model.predictor"
        ],
        check=True
    )
    
def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--destination",
        required=True,
    )

    parser.add_argument(
        "--checkin",
        required=True,
    )

    parser.add_argument(
        "--checkout",
        required=True,
    )

    parser.add_argument(
        "--flex",
        type=int,
        default=0,
    )

    args = parser.parse_args()

    print("===================================")
    print("Paseo")
    print("===================================")
    print(f"Destination : {args.destination}")
    print(f"Check-in    : {args.checkin}")
    print(f"Check-out   : {args.checkout}")
    print(f"Flex        : {args.flex}")
    print()
    print("Running Airbnb scraper...")

    print(args)

    print("Running Airbnb scraper...")
    run_scraper(args)
    run_predictions()
    print("Starting dashboard...")
    run_dashboard()

    print("Done.")


if __name__ == "__main__":
    main()