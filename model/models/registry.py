# model/models/__init__.py

from . import value
from . import likes
from . import maximization

MODELS = {
    value.id: value,
    likes.id: likes,
    maximization.id: maximization,
}


def get_model(name):
    return MODELS[name]


def get_model_options():
    return [
        {
            "label": model.NAME,
            "value": key,
        }
        for key, model in MODELS.items()
    ]