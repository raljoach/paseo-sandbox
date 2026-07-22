import argparse
import subprocess
from pathlib import Path
import sys
import webbrowser
import time
from model.run_predictions import run_predictions
import socket
import json
from datetime import datetime
from dashboard.data import (
    get_file,
    get_metadata,
    get_listings,
)

from common.metadata import create_prefix

PIPELINE = {
    "scrape": "process",
    "process": "predict",
    "predict": "dashboard",
    "dashboard": None,
}

def run_combine(files):
    metadata = None
    listings = []
    destinations = []

    for file in files:
        contents = get_file(file)
        current_metadata = get_metadata(contents)
        if metadata is None:
            metadata = current_metadata.copy()

        listings.extend(
            get_listings(contents).to_dict(orient="records")
        )

        destination = current_metadata.get("destination")
        if destination:
            destinations.append(destination)

    print(destinations)
    for d in destinations:
        print(type(d), d)
        
    #
    # Update metadata
    #

    metadata.pop("destination", None)
    metadata.pop("city", None)
    metadata.pop("country", None)

    metadata["destinations"] = sorted(set(destinations))

    metadata["combined"] = True
    metadata["scrapedAt"] = (
        datetime.utcnow()
        .isoformat(timespec="seconds")
        + "Z"
    )

    #
    # Build output filename
    #

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    prefix = f"{metadata['source']}_multi_{timestamp}"

    output = (
        Path(__file__).parent
        / "data"
        / "processed"
        / f"{prefix}_features.json"
    )

    payload = {
        "metadata": metadata,
        "listings": listings,
    }

    with open(output, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"Combined {len(files)} files")
    print(f"Total listings: {len(listings)}")
    print(f"Saved {output}")
    return str(output)

def dashboard_running():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", 8050)) == 0

def run_scraper(args):
    artifacts = []
    root = Path(__file__).resolve().parent
    for destination in args.destination:

        cmd = [
            "node",
            f"extractors/{args.site}/browser.js",
            destination,
        ]

        if args.checkin:
            cmd.append(args.checkin)

        if args.checkout:
            cmd.append(args.checkout)

        if args.flex:
            cmd.append(str(args.flex))


        result = subprocess.run(
            cmd,
            cwd=root,
            check=True,
            capture_output=True,
            text=True
        )

        print(result.stdout)

        artifact = (
            result.stdout
            .strip()
            .splitlines()[-1]
        )

        artifacts.append(artifact)


    return artifacts

def run_processor(input_file):
    root = Path(__file__).resolve().parent

    cmd = [
        "node",
        "processing/processor.js",
        "--from-file",
        input_file
    ]

    result = subprocess.run(
        cmd,
        cwd=root,
        capture_output=True,
        text=True
    )

    print("STDOUT")
    print(result.stdout)

    print("STDERR")
    print(result.stderr)

    result.check_returncode()

    ranked_file = result.stdout.strip().splitlines()[-1]
    return ranked_file

def run_predict(input_file):
    return run_predictions(input_file)

def run_dashboard(input_file):
    print("Starting dashboard...")
    subprocess.Popen([
        sys.executable,
        "-m",
        "dashboard.app",
        "--from-file",
        input_file
    ])

    time.sleep(3)

    webbrowser.open(
        "http://127.0.0.1:8050"
    )

    print("Dashboard running.")

def main():
    parser = argparse.ArgumentParser()

    subparsers = parser.add_subparsers(
        dest="phase",
        required=True
    )

    

    scrape = subparsers.add_parser(
    "scrape"
)

    scrape.add_argument(
        "site"
    )

    scrape.add_argument(
        "--destination",
        nargs="+",
        required=True
    )

    scrape.add_argument(
        "--checkin"
    )

    scrape.add_argument(
        "--checkout"
    )

    scrape.add_argument(
        "--flex",
        type=int,
        default=0
    )

    process = subparsers.add_parser(
        "process"
    )

    group = process.add_mutually_exclusive_group(
        required=True
    )

    group.add_argument(
        "--from-file"
    )

    group.add_argument(
        "--from-directory"
    )

    predict = subparsers.add_parser(
        "predict"
    )


    predict.add_argument(
        "--from-file",
        required=True
    )

    dashboard = subparsers.add_parser(
        "dashboard"
    )


    dashboard.add_argument(
        "--from-file",
        required=True
    )

    args = parser.parse_args()

    print("===================================")
    print("Paseo")
    print("===================================")
    print(args)

    # print("Running Airbnb scraper...")
    # run_scraper(args)
    # subprocess.run([
    #     "node",
    #     "processing/processor.js",
    #     "--from-directory",
    #     "data/input"
    # ], check=True)
    # if args.site == "airbnb" and model_exists():
    #     run_predictions(
    #         site=args.site,
    #         source=args.source
    #     )
    # else:
    #     print(
    #         f"Skipping predictions for {args.site}"
    #     )
    # print("Starting dashboard...")
    # run_dashboard(args)

    # if args.phase=="scrape":
    #     run_scraper(args)

    # elif args.phase=="process":
    #     run_processor(args)

    # elif args.phase=="predict":
    #     run_predict(args)

    # elif args.phase=="dashboard":
    #     run_dashboard(args)

    current_phase = args.phase
    artifacts = [getattr(args, "from_file", None)]
    while current_phase:
        print(f"\n=== {current_phase.upper()} ===")
        if current_phase == "scrape":
            artifacts = run_scraper(args)
            # processed = []
            # for artifact in artifacts:
            #     processed.append(
            #         run_processor(artifact)
            #     )

            # combined = run_combine(processed)

            # artifact = combined

        elif current_phase == "process":
            # artifact = run_processor(artifact)
            processed = [
                run_processor(a)
                for a in artifacts
            ]

            artifacts = [
                run_combine(processed)
            ]

        elif current_phase == "predict":
            (artifact,) = artifacts
            prediction = run_predict(artifact)
            if prediction is not None:
                artifacts = [prediction]

        elif current_phase == "dashboard":
            (artifact,) = artifacts
            run_dashboard(artifact)

        current_phase = PIPELINE[current_phase]

    print("Done.")


if __name__ == "__main__":
    main()