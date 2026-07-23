from dashboard.figures import create_value_graph
id = "value"
name = "Value"
def evaluate(df):
    """
    Returns dataframe ranked by value score.
    """
    return (
        df.sort_values(
            "core_value",
            ascending=False
        )
        .reset_index(drop=True)
    )

def model_columns():
    return [
        "core_value",
    ]


def create_graph(df, metric):
    return create_value_graph(df, metric)

def sort(df):
    return (
        df.sort_values("core_value", ascending=False)
          .reset_index(drop=True)
    )