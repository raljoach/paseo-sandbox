from dash import Dash, html, dash_table
import pandas as pd
from pathlib import Path
from dashboard import callbacks
from model.likes import load_likes
from dashboard.figures import create_value_graph
from dash import dcc
from dashboard.data import load_dataframe, get_file, get_listings, get_metadata
import argparse

app = Dash(__name__)
parser = argparse.ArgumentParser()

parser.add_argument(
    "--from-file",
    required=True
)

args = parser.parse_args()
file = args.from_file
print("LOADING file: ", file)
# df = pd.read_json(
#     args.from_file
# )

contents = get_file(file)
metadata = get_metadata(contents)
listing_type = metadata["listingType"]
source = metadata["source"]
df = get_listings(contents)
IS_SHORT_TERM = (
    listing_type == "short-term-stay"
)

IS_LONG_TERM = (
    listing_type == "long-term-rental"
)

# print("Likes loaded:", len(likes))
# print(list(likes.items())[:5])



# print("likes sample:", list(likes.items())[:5])
# print(df[["id"]].head())
# print(type(df.iloc[0]["id"]))


df = df.drop(columns=["debug"], errors="ignore")

AIRBNB_COLUMNS = [
            {
                "name": "Like",
                "id": "like",
                "presentation": "dropdown",
            },
            {
                "name": "Prediction",
                "id": "predictedLike",
            },
            {
                "name": "Probability",
                "id": "likeProbability",
                "type": "numeric",
                "format": {
                    "specifier": ".2f"
                },
            },
            {
                "name": "ID",
                "id": "idLink",
                "presentation": "markdown",
            },
            {"name": "Description", "id": "description"},
            {"name": "Rating", "id": "rating"},
            {"name": "Reviews", "id": "reviews"},
            {"name": "$/night", "id": "perNight"},
            {"name": "Rooms", "id": "bedrooms"},
            {"name": "Baths", "id": "bathrooms"},
            {"name": "Bucket", "id": "ratingBucket"},
            {"name": "Score", "id": "valueScore","type": "numeric",
                "format": {
                    "specifier": ".3f"
                },},
        ]

FACEBOOK_COLUMNS = [
    {"name":"Like","id":"like","presentation":"dropdown"},
    {"name":"Prediction","id":"predictedLike"},
    {"name":"Probability","id":"likeProbability"},
    {
        "name":"ID",
        "id":"idLink",
        "presentation":"markdown"
    },
    {"name":"Title","id":"title"},
    {"name":"Price","id":"monthlyRent"},
    {"name":"Beds","id":"bedrooms"},
    {"name":"Baths","id":"bathrooms"},
    {"name":"Size","id":"propertySize"},
    {"name":"City","id":"city"},
    {"name":"Type","id":"propertyType"},

    # {"name":"Furnished","id":"isFurnished"},
    # {"name":"Parking","id":"hasParking"},
    # {"name":"Pets","id":"allowsPets"},
    # {"name":"Balcony","id":"hasBalcony"},
    # {"name":"Elevator","id":"hasElevator"},
]

# -------------------------
# Controls
# -------------------------

if IS_SHORT_TERM:

    controls = [

        html.H3("Graph Controls"),

        dcc.Input(
            id="current-airbnb",
            placeholder="Current Airbnb ID"
        ),

        dcc.Dropdown(
            id="rating-filter",
            options=[
                {"label":"All Ratings","value":"ALL"},
                {"label":"5.0","value":"5"},
                {"label":"4.9-4.99","value":"4.9"},
                {"label":"4.8-4.89","value":"4.8"},
                {"label":"4.7-4.79","value":"4.7"},
            ],
            value="ALL"
        ),

        dcc.Dropdown(
            id="metric-selector",
            options=[
                {"label":"Rating / Night","value":"rating"},
                {"label":"Value Score","value":"core_value"},
            ],
            value="core_value"
        ),

        dcc.Graph(id="airbnb-value-graph")
    ]

else:

    controls = [

        html.H3("Facebook Filters"),

        dcc.Dropdown(
            id="price-filter",
            options=[
                {"label":"Any Price","value":"ALL"},
                {"label":"< $700","value":"700"},
                {"label":"$700-$900","value":"900"},
                {"label":"$900-$1100","value":"1100"},
                {"label":"> $1100","value":"999999"},
            ],
            value="ALL"
        )

    ]

app.layout = html.Div([
    html.H2("Paseo"),
    *controls,
    html.Div(id="selected-airbnb"),
    html.Div(id="airbnb-link"),
    html.Button(
        "💾 Save Likes",
        id="save-likes",
        n_clicks=0
    ),
    html.Div(id="save-status"),
    dash_table.DataTable(
        id="airbnb-table",
        data=df.to_dict("records"),
        columns = (
            AIRBNB_COLUMNS
            if IS_SHORT_TERM
            else FACEBOOK_COLUMNS
        ),
        hidden_columns=["listingId", "url"],
        css=[{
            "selector": ".show-hide",
            "rule": "display: none"
        }],
        dropdown={
            "like": {
                "options": [
                    {"label": "", "value": ""},
                    {"label": "YES", "value": "YES"},
                    {"label": "NO", "value": "NO"},
                ]
            }
        },
        fixed_rows={"headers": True},
        style_cell_conditional=[
            {
                "if": {"column_id": "like"},
                "width": "55px",
                "minWidth": "55px",
                "maxWidth": "55px",
            },
            {
                "if": {"column_id": "rating"},
                "width": "70px",
                "minWidth": "70px",
                "maxWidth": "70px",
            },
            {
                "if": {"column_id": "reviews"},
                "width": "80px",
                "minWidth": "80px",
                "maxWidth": "80px",
            },
            {
                "if": {"column_id": "bedrooms"},
                "width": "80px",
                "minWidth": "80px",
                "maxWidth": "80px",
            },
            {
                "if": {"column_id": "bathrooms"},
                "width": "80px",
                "minWidth": "80px",
                "maxWidth": "80px",
            },
            {
                "if": {"column_id": "predictedLike"},
                "width": "95px",
                "minWidth": "95px",
                "maxWidth": "95px",
            },
            {
                "if": {"column_id": "likeProbability"},
                "width": "100px",
                "minWidth": "100px",
                "maxWidth": "100px",
            },
            {
                "if": {"column_id": "description"},
                "width": "540px",
                "minWidth": "540px",
                "maxWidth": "540px",
            },
            {
                "if":{"column_id":"monthlyRent"},
                "width":"90px",
            },
            {
                "if":{"column_id":"title"},
                "width":"500px",
            },
            {
                "if":{"column_id":"city"},
                "width":"140px",
            }
        ],
        # style_table={
        #     "height": "700px",      # or whatever height you want
        #     "overflowY": "auto",
        #     "overflowX": "auto",
        # },
        editable=True,

        markdown_options={
            "link_target": "_blank"
        },

        sort_action="native",
        filter_action="native",
        # filter_query="",
        page_size=100,
    )
])

callbacks.register_callbacks(
    app,
    args
)

if __name__ == "__main__":
    app.run(
        debug=False,
        use_reloader=False
    )

# if __name__ == "__main__":
#     app.run(debug=True)