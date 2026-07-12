import json
import pandas as pd
from pathlib import Path
from dash import Input, Output, State, html
from dashboard.figures import create_value_graph
from model.trainer import train
from model.predictor import generate_predictions
from model.evaluate import evaluate
from dashboard.data import load_dataframe
from model.likes import load_likes
from dashboard.filters import apply_filters

BASE = Path(__file__).parent.parent


LIKES = (
    BASE
    / "data"
    / "processed"
    / "airbnb_likes.json"
)


PREDICTIONS = (
    BASE
    / "data"
    / "processed"
    / "airbnb_predictions.json"
)


FEATURES = (
    BASE
    / "data"
    / "processed"
    / "airbnb_medellin_features.json"
)



def register_callbacks(app):


    #
    # SAVE USER LIKES + TRAIN MODEL
    #

    @app.callback(

        Output(
            "save-status",
            "children"
        ),

        Input(
            "save-likes",
            "n_clicks"
        ),

        State(
            "airbnb-table",
            "data"
        ),

        prevent_initial_call=True
    )


    def save_likes(n_clicks, rows):

        existing = load_likes()

        for row in rows:

            if row["like"]:

                existing[str(row["listingId"])] = row["like"]


        with open(LIKES, "w") as f:

            json.dump(
                existing,
                f,
                indent=2
            )


        #
        # Train model
        #

        model = train()

        if model is None:
            return (
                f"Saved {len(likes)} labels. "
                "Need at least one YES and one NO before predictions can be generated."
            )

        evaluate(model)

        features = pd.read_json(FEATURES)

        # remove UI-only columns

        features = features.drop(
            columns=[
                "idLink"
            ],
            errors="ignore"
        )

        features["id"] = features["id"].astype(str)
        predictions = generate_predictions(
            model,
            features
        )

        predictions.to_json(
            PREDICTIONS,
            orient="records",
            indent=2
        )

        return (
            f"Saved {len(likes)} labels. "
            f"Generated {len(predictions)} predictions."
        )
    
    @app.callback(
        Output("airbnb-table", "data"),
        Input("rating-filter", "value"),
        Input("current-airbnb", "value"),
    )
    def update_table(
        rating_filter,
        current_airbnb,
    ):

        df = load_dataframe()

        df = apply_filters(
            df,
            rating_filter,
            current_airbnb
        )

        df = (
            df.sort_values("core_value", ascending=False)
            .reset_index(drop=True)
        )
        return df.to_dict("records")

    #
    # GRAPH FILTERS
    #

    @app.callback(
        Output(
            "airbnb-value-graph",
            "figure"
        ),
        Input(
            "rating-filter",
            "value"
        ),
        Input(
            "metric-selector",
            "value"
        ),
        Input("current-airbnb", "value")
    )
    def update_graph(
        rating_filter,
        metric,
        current_airbnb
    ):

        df = load_dataframe()

        df["is_current"] = False

        if current_airbnb:
            df["is_current"] = (
                df["listingId"]
                .astype(str)
                == str(current_airbnb)
            )



        df = apply_filters(
            df,
            rating_filter,
            current_airbnb
        )

        return create_value_graph(df, metric)

        # if rating_filter != "ALL":

        #     if rating_filter == "5":
        #         df = df[df.rating == 5]

        #     elif rating_filter == "4.9":
        #         df = df[
        #             (df.rating >= 4.9) &
        #             (df.rating < 5)
        #         ]

        #     elif rating_filter == "4.8":
        #         df = df[
        #             (df.rating >= 4.8) &
        #             (df.rating < 4.9)
        #         ]

        #     elif rating_filter == "4.7":
        #         df = df[
        #             (df.rating >= 4.7) &
        #             (df.rating < 4.8)
        #         ]

        # # print(
        # #     df[
        # #         [
        # #             "listingId",
        # #             "like",
        # #             "predictedLike",
        # #             "likeProbability"
        # #         ]
        # #     ].head(20)
        # # )
        # return create_value_graph(
        #     df,
        #     metric
        # )
    
    @app.callback(
        Output(
            "selected-airbnb",
            "children"
        ),
        Input(
            "airbnb-value-graph",
            "clickData"
        )
    )
    def open_selected(click):

        if not click:
            return ""


        point = click["points"][0]

        url = point["customdata"][4]

        listing_id = point["customdata"][0]


        return html.A(
            f"Open Airbnb {listing_id}",
            href=url,
            target="_blank"
        )
    
    @app.callback(
        Output(
            "airbnb-link",
            "children"
        ),
        Input(
            "airbnb-value-graph",
            "clickData"
        )
    )
    def open_listing(click):

        if not click:
            return ""


        url = click["points"][0]["customdata"][4]


        return html.A(
            "Open Airbnb Listing",
            href=url,
            target="_blank"
        )