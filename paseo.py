import argparse
import subprocess
from pathlib import Path
import sys
import webbrowser
import time
from model.paths import model_exists
from model.run_predictions import run_predictions

def run_dashboard(args):
    print("Starting dashboard...")
    subprocess.Popen([
        sys.executable,
        "-m",
        "dashboard.app",
        "--site",
        args.site,
        "--source",
        args.source
    ])

    time.sleep(3)

    webbrowser.open(
        "http://127.0.0.1:8050"
    )

    print("Dashboard running.")

def run_scraper(args):
    root = Path(__file__).resolve().parent

    cmd = [
        "node",
        f"extractors/{args.site}/browser.js"
    ]
    cmd.extend([
        "--source",
        args.source
    ])

    if args.site == "airbnb":
        cmd.append(args.destination)

        if args.checkin:
            cmd.append(args.checkin)

        if args.checkout:
            cmd.append(args.checkout)

        if args.flex:
            cmd.append(str(args.flex))

    if args.from_file:
        cmd.extend([
            "-from-file",
            args.from_file
        ])

    subprocess.run(cmd, cwd=root, check=True)

# def run_predictions(args):
#     subprocess.run([
#         sys.executable,
#         "-m",
#         "model.run_predictions",
#         "--site",
#         args.site,
#         "--source",
#         args.source
#     ], check=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--site",
        default="airbnb",
        choices=[
            "airbnb",
            "facebook"
        ]
    )

    parser.add_argument(
        "--source",
        default="short-term",
        choices=[
            "short-term",
            "long-term"
        ]
    )

    parser.add_argument(
        "--destination"
    )

    parser.add_argument(
        "--checkin"
    )

    parser.add_argument(
        "--checkout"
    )

    parser.add_argument(
        "--from-file",
        help="Path to an existing JSON file"
    )

    parser.add_argument(
        "--flex",
        type=int,
        default=0,
    )

    args = parser.parse_args()

    if (
        not args.from_file
        and
        not args.destination
    ):
        parser.error(
            "--destination is required unless using --from-file"
        )

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
    if args.site == "airbnb" and model_exists():
        run_predictions(
            site=args.site,
            source=args.source
        )
    else:
        print(
            f"Skipping predictions for {args.site}"
        )
    print("Starting dashboard...")
    run_dashboard(args)

    print("Done.")


if __name__ == "__main__":
    main()