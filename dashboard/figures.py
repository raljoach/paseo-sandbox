import plotly.express as px
import pandas as pd

def create_value_graph(df, metric):

    df = df.sort_values(
        "core_value",
        ascending=True
    ).reset_index(drop=True)

    df["predictionDisplay"] = df["likeProbability"].apply(
        lambda x: f"Prediction: {x:.3f}<br>" if pd.notnull(x) else ""
    )

    df["color"] = "Other"

    # User decisions first
    df.loc[
        df["like"] == "YES",
        "color"
    ] = "User YES"


    df.loc[
        df["like"] == "NO",
        "color"
    ] = "User NO"


    # AI predictions only if user has not labeled it
    df.loc[
        (df["like"] == "") &
        (df["predictedLike"] == "YES"),
        "color"
    ] = "Predicted YES"


    df.loc[
        (df["like"] == "") &
        (df["predictedLike"] == "NO"),
        "color"
    ] = "Predicted NO"


    # Current overrides everything
    if "is_current" in df.columns:
        df.loc[
            df["is_current"],
            "color"
        ] = "Current Airbnb"

    print(df["color"].value_counts())
    print(df[["like", "predictedLike", "color"]].value_counts())
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
            "predictionDisplay"     
        ],
       color_discrete_map={
            "Current Airbnb": "#ff0000",   # Bright Red
            "User YES": "#00cc44",         # Green
            "User NO": "#8B4513",          # SaddleBrown
            "Predicted YES": "#ff00ff",    # Fuchsia
            "Predicted NO": "#ff8c00",     # Dark Orange
            "Other": "#0066ff",            # Blue
        }
    )


    fig.update_traces(
        hovertemplate=
        "<b>%{customdata[1]}</b><br>"
        "ID: %{customdata[0]}<br>"
        "Rating: %{customdata[3]}<br>"
        "Price: $%{customdata[2]}/night<br>"
        "Value: %{y:.3f}<br>"
        "%{customdata[5]}"
        "<extra></extra>"
    )


    fig.update_layout(
        clickmode="event+select"
    )


    return fig