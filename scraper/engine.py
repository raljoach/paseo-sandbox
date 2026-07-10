from scraper.exporter import export_csv, export_json
from scraper.schema import (
    load_schema,
    validate_row
)


def run(rows):

    schema = load_schema(
        "extractors/airbnb/schema.yml"
    )

    errors = []

    for i,row in enumerate(rows):

        row_errors = validate_row(
            row,
            schema
        )

        if row_errors:
            errors.append(
                {
                    "row":i,
                    "errors":row_errors
                }
            )


    if errors:
        print(
            "VALIDATION ERRORS"
        )

        for e in errors:
            print(e)


    export_json(
        rows,
        "data/raw/airbnb.json"
    )

    export_csv(
        rows,
        "data/output/airbnb.csv"
    )