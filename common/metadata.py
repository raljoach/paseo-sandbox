from datetime import datetime


def create_prefix(metadata):

    source = metadata.get(
        "source",
        "unknown"
    )

    city = metadata.get(
        "city",
        "unknown"
    )

    country = metadata.get(
        "country",
        ""
    )

    scraped_at = metadata.get(
        "scrapedAt"
    )

    timestamp = (
        datetime
        .fromisoformat(
            scraped_at.replace(
                "Z",
                "+00:00"
            )
        )
        .strftime(
            "%Y%m%dT%H%M%S"
        )
    )


    parts = [
        source,
        city,
        country,
        timestamp
    ]

    return "_".join(
        x for x in parts if x
    )