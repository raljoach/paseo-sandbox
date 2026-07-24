from model.models.base_model import BaseModel
from dashboard.figures import create_value_graph

class OptimizationModel(BaseModel):
    name = "optimization"
    metric = "optimizationScore"
    def evaluate(self, df):
        df[self.metric] = (
            df["valueScore"]
        )
        return (
            df.sort_values(
                self.metric,
                ascending=False
            )
            .reset_index(drop=True)
        )

    def model_columns(self):
        return [
            {
                "name": "Optimization",
                "id": self.metric,
                "type": "numeric",
                "format": {
                    "specifier": ".3f"
                }
            }
        ]