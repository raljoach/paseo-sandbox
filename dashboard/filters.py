def apply_filters(df, rating_filter, current_listing, destination_filter):

    df["is_current"] = False

    if destination_filter != "ALL":
        df = df[df["destination"] == destination_filter]

    if current_listing:
        df["is_current"] = (
            df["listingId"].astype(str)
            == str(current_listing)
        )

    if rating_filter == "5":
        df = df[df.rating == 5]

    elif rating_filter == "4.9":
        df = df[
            (df.rating >= 4.9) &
            (df.rating < 5)
        ]

    elif rating_filter == "4.8":
        df = df[
            (df.rating >= 4.8) &
            (df.rating < 4.9)
        ]

    elif rating_filter == "4.7":
        df = df[
            (df.rating >= 4.7) &
            (df.rating < 4.8)
        ]

    return df