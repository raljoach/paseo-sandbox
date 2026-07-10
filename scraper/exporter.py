import csv
import json
from pathlib import Path


def normalize_value(value):
    if value is None:
        return ""

    if isinstance(value, (dict, list)):
        return json.dumps(value)

    return value


def export_csv(rows, filename):

    Path(filename).parent.mkdir(
        parents=True,
        exist_ok=True
    )

    columns = sorted(
        set(
            key
            for row in rows
            for key in row.keys()
        )
    )

    with open(
        filename,
        "w",
        newline="",
        encoding="utf-8"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=columns
        )

        writer.writeheader()

        for row in rows:
            writer.writerow(
                {
                    k: normalize_value(row.get(k))
                    for k in columns
                }
            )


def export_json(rows, filename):

    Path(filename).parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            rows,
            f,
            indent=2,
            ensure_ascii=False
        )