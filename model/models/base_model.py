from dashboard.figures import create_value_graph

class BaseModel:
    name = None
    metric = None

    def evaluate(self, df):
        raise NotImplementedError

    def model_columns(self):
        return []

    def create_graph(self, df):
        return create_value_graph(
            df,
            self.metric
        )