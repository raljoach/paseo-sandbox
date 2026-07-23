from dashboard.figures import create_value_graph
id = "likes"
name = "Likes"
def evaluate(df):
    return (
        df.sort_values(
            "likeProbability",
            ascending=False
        )
        .reset_index(drop=True)
    )

def model_columns():
    return [
        "likeProbability",
        "predictedLike",
    ]

def create_graph(df, metric):
    return create_value_graph(df, metric)

def sort(df):
    return (
        df.sort_values("likeProbability", ascending=False)
          .reset_index(drop=True)
    )