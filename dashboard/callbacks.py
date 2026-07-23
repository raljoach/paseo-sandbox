import json
import pandas as pd
from pathlib import Path
from dash import Input, Output, State, html
from dashboard.figures import create_value_graph
from model.trainer import train
from model.predictor import generate_predictions
from dashboard.data import load_dataframe, get_file, get_metadata, get_listings
from model.likes import load_likes
from dashboard.filters import apply_filters
from model.paths import (
    rank_file,
    features_file,
    likes_file,
)
from common.metadata import create_prefix
from model.models.registry import get_model

def register_callbacks(app, args):
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
        metadata = get_metadata(
            get_file(args.from_file)
        )

        prefix = create_prefix(metadata)
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

        file = features_file(prefix)
        print('LOADING: ', file)
        contents = get_file(file)
        features = get_listings(contents)

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
        Input("destination-filter","value"),
        Input("model-selector","value")
    )
    def update_table(
        rating_filter,
        current_airbnb,
        destination_filter,
        model_name
    ):
        prefix, metadata, listings = load_dataframe(
            args.from_file
        )

        

        # listings = (
        #     listings.sort_values("core_value", ascending=False)
        #     .reset_index(drop=True)
        # )
        model = get_model(model_name)
        listings = model.evaluate(listings)
        listings = apply_filters(
                    listings,
                    rating_filter,
                    current_airbnb,
                    destination_filter
                )
        listings = model.sort(listings)
        return listings.to_dict("records")

    #
    # GRAPH FILTERS
    #

    @app.callback(
        Output("airbnb-value-graph", "figure"),
        Input("destination-filter", "value"),
        Input("rating-filter", "value"),
        Input("metric-selector", "value"),
        Input("current-airbnb", "value"),
        Input("model-selector","value")
    )
    def update_graph(
        destination_filter,
        rating_filter,
        metric,
        current_airbnb,
        model_name
    ):
        prefix, metadata, listings = load_dataframe(
            args.from_file
        )

        listings["is_current"] = False

        if current_airbnb:
            listings["is_current"] = (
                listings["listingId"]
                .astype(str)
                == str(current_airbnb)
            )

        listings = apply_filters(
            listings,
            rating_filter,
            current_airbnb,
            destination_filter
        )
        model = get_model(model_name)
        return model.create_graph(
            listings,
            metric
        )

        # return create_value_graph(listings, metric)

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