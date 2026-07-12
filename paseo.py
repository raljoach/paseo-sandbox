import argparse
import subprocess
from pathlib import Path
import sys
import webbrowser
import time
from model.paths import model_exists

def run_dashboard():

    print("Starting dashboard...")

    subprocess.Popen(
        [
            sys.executable,
            "-m",
            "dashboard.app"
        ]
    )

    time.sleep(3)

    webbrowser.open(
        "http://127.0.0.1:8050"
    )

    print("Dashboard running.")

def run_scraper(args):
    root = Path(__file__).resolve().parent

    cmd = [
        "node",
        "extractors/airbnb/browser.js",
        args.destination,
    ]

    if args.checkin:
        cmd.append(args.checkin)

    if args.checkout:
        cmd.append(args.checkout)

    if args.flex:
        cmd.append(str(args.flex))

    if args.from_file:
        cmd.append("--from-file")

    print(cmd)

    subprocess.run(
        cmd,
        cwd=root,
        check=True,
    )

def run_predictions():
    subprocess.run(
        [
            sys.executable,
            "-m",
            "model.run_predictions"
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
        "--checkin"
    )

    parser.add_argument(
        "--checkout"
    )

    parser.add_argument(
        "--from-file",
        action="store_true"
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
    if model_exists():
        run_predictions()
    else:
        print("No trained model found.")
    print("Starting dashboard...")
    run_dashboard()

    print("Done.")


if __name__ == "__main__":
    main()