# model/models/__init__.py
from model.models.value import ValueModel
from model.models.optimizaton import OptimizationModel

MODELS = {
"value": ValueModel(),
"optimization": OptimizationModel()

}

def get_model(name):
    print('look for model: ', name)
    return MODELS[name]


def get_model_options():
    return [
        {
            "label": model.NAME,
            "value": key,
        }
        for key, model in MODELS.items()
    ]