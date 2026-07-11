from dash import Dash, html, dash_table
import pandas as pd
from pathlib import Path
from dashboard import callbacks
from model.likes import load_likes
from dashboard.figures import create_value_graph
from dash import dcc
from dashboard.data import load_dataframe

app = Dash(__name__)
df = load_dataframe()

# print("Likes loaded:", len(likes))
# print(list(likes.items())[:5])



# print("likes sample:", list(likes.items())[:5])
# print(df[["id"]].head())
# print(type(df.iloc[0]["id"]))


df = df.drop(columns=["debug"], errors="ignore")
app.layout = html.Div([
    html.H2("Paseo"),
    html.H3("Graph Controls"),
    dcc.Input(
        id="current-airbnb",
        placeholder="Current Airbnb ID"
    ),
    dcc.Dropdown(

        id="rating-filter",

        options=[
            {
                "label": "All Ratings",
                "value": "ALL"
            },
            {
                "label": "5.0",
                "value": "5"
            },
            {
                "label": "4.9-4.99",
                "value": "4.9"
            },
            {
                "label": "4.8-4.89",
                "value": "4.8"
            },
            {
                "label": "4.7-4.79",
                "value": "4.7"
            },
        ],

        value="ALL"
    ),


    dcc.Dropdown(

        id="metric-selector",

        options=[
            {
                "label": "Rating / Night",
                "value": "rating"
            },
            {
                "label": "Value Score",
                "value": "core_value"
            }
        ],

        value="core_value"
    ),


    dcc.Graph(
        id="airbnb-value-graph"
    ),
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
        columns=[
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
            {"name": "Bedrooms", "id": "bedrooms"},
            {"name": "Bathrooms", "id": "bathrooms"},
            {"name": "Bucket", "id": "ratingBucket"},
            {"name": "Score", "id": "valueScore"},
        ],
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

callbacks.register_callbacks(app)

if __name__ == "__main__":
    app.run(debug=True)