import plotly.express as px


def create_value_graph(df, metric):

    df = df.sort_values(
        "core_value",
        ascending=True
    ).reset_index(drop=True)

    df["color"] = "Other"

    # Explicit likes
    df.loc[
        df["like"] == "YES",
        "color"
    ] = "Liked"

    # AI predictions (only unlabeled listings)
    df.loc[
        (df["predictedLike"] == "YES") &
        (df["like"] == ""),
        "color"
    ] = "Predicted"

    # Current Airbnb overrides everything
    if "is_current" in df.columns:
        df.loc[
            df["is_current"],
            "color"
        ] = "Current Airbnb"

    fig = px.scatter(
        df,
        x=df.index,
        y=metric,
        color="color",
        custom_data=[
            "listingId",
            "description",
            "perNight",
            "rating",
            "url",
        ],
        color_discrete_map={
            "Current Airbnb": "#ff0000",   # red
            "Liked": "#00cc44",            # green
            "Predicted": "#ff00ff",        # fuchsia
            "Other": "#0066ff",            # blue
        },
    )


    fig.update_traces(
        hovertemplate=
        "<b>%{customdata[1]}</b><br>"
        "ID: %{customdata[0]}<br>"
        "Rating: %{customdata[3]}<br>"
        "Price: $%{customdata[2]}/night<br>"
        "Value: %{y:.3f}"
        "<extra></extra>"
    )


    fig.update_layout(
        clickmode="event+select"
    )


    return fig