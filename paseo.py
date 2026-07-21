import argparse
import subprocess
from pathlib import Path
import sys
import webbrowser
import time
from model.run_predictions import run_predictions
import socket

PIPELINE = {
    "scrape": "process",
    "process": "predict",
    "predict": "dashboard",
    "dashboard": None,
}


def dashboard_running():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", 8050)) == 0

def run_scraper(args):
    root = Path(__file__).resolve().parent
    cmd = [
        "node",
        f"extractors/{args.site}/browser.js"
    ]

    if args.site == "airbnb":
        cmd.append(args.destination)
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
        text=True)
    print(result.stdout)

    artifact = result.stdout.strip().splitlines()[-1]

    return artifact

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
        "--destination"
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
    artifact = getattr(args, "from_file", None)
    while current_phase:
        print(f"\n=== {current_phase.upper()} ===")
        if current_phase == "scrape":
            artifact = run_scraper(args)

        elif current_phase == "process":
            artifact = run_processor(artifact)

        elif current_phase == "predict":
            file = run_predict(artifact)
            if file is not None:
                artifact = file

        elif current_phase == "dashboard":
            run_dashboard(artifact)

        current_phase = PIPELINE[current_phase]

    print("Done.")


if __name__ == "__main__":
    main()