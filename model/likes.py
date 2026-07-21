from model.paths import likes_file
import json

print("LOADING LIKES FROM:", __file__)

def load_likes():
    print("NEW load_likes() CALLED")

    if not likes_file().exists():
        return {}

    with open(likes_file()) as f:
        data = json.load(f)

    print(type(data), data)

    return data