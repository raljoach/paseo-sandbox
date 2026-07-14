import json
import pandas as pd
from pathlib import Path
from dash import Input, Output, State, html
from dashboard.figures import create_value_graph
from model.trainer import train
from model.predictor import generate_predictions
from dashboard.data import load_dataframe
from model.likes import load_likes
from dashboard.filters import apply_filters
from model.paths import (predictions_path, features_path, LIKES)

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
        updated_count = 0
        for row in rows:
            if row["like"]:
                if row["like"] in ("YES","NO"):
                    previous = existing.get(str(row["listingId"]))
                    if previous != row["like"]:
                        updated_count += 1

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

        success = train()

        if not success:
            return (
                f"Saved {updated_count} label updates. "
                "Need more YES/NO labels before predictions can be generated."
            )

        features = pd.read_json(features_path)

        # remove UI-only columns

        
        predictions = generate_predictions(
            features
        )

        likes = load_likes()

        predictions["like"] = (
            predictions["id"]
            .map(likes)
            .fillna("")
        )

        predictions.to_json(
            predictions_path,
            orient="records",
            indent=2
        )

        return (
            f"Saved {updated_count} label updates. "
            f"Generated {len(predictions)} predictions."
        )
    
    @app.callback(
        Output("airbnb-table", "data"),
        Input("rating-filter", "value"),
        Input("current-airbnb", "value"),
    )
    def update_table(
        rating_filter,
        current_listing,
    ):

        df = load_dataframe()

        df = apply_filters(
            df,
            rating_filter,
            current_listing
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
        current_listing
    ):

        df = load_dataframe()

        df["is_current"] = False

        if current_listing:
            df["is_current"] = (
                df["listingId"]
                .astype(str)
                == str(current_listing)
            )



        df = apply_filters(
            df,
            rating_filter,
            current_listing
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