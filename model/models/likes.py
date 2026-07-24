from model.models.base_model import BaseModel
from dashboard.figures import create_value_graph

class LikesModel(BaseModel):
    name = "Likes"
    metric = "likeProbability"
    def evaluate(self, df):
        return (
            df.sort_values(
                self.metric,
                ascending=False
            )
            .reset_index(drop=True)
        )

    def model_columns(self):
        return [
            #     {"name":"Prediction","id":"predictedLike"},
#     {"name":"Probability","id":"likeProbability"},
            {
                "name": "Prediction",
                "id": "predictedLike",
                # "type": "numeric",
                # "format": {
                #     "specifier": ".3f"
                # }
            },
            {
                "name": "Probability",
                "id": self.metric,
                # "type": "numeric",
                # "format": {
                #     "specifier": ".3f"
                # }
            }
        ]