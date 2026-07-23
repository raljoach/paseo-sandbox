id = "maximize"
name = "Maximization"

def evaluate(self, df):
    df = df.copy()
    df["score"] = df["core_value"]
    return df

def model_columns():
    return [
        "score",
    ]

def create_graph(self, df):
    raise NotImplementedError

def sort(df):
    return (
        df.sort_values("score", ascending=False)
          .reset_index(drop=True)
    )