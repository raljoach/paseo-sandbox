from model.paths import LIKES
import json

print("LOADING LIKES FROM:", __file__)

def load_likes():
    print("NEW load_likes() CALLED")

    if not LIKES.exists():
        return {}

    with open(LIKES) as f:
        data = json.load(f)

    print(type(data), data)

    return data