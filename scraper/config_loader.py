import yaml
import os


def load_site_config(site_name):
    """
    Load scraper configuration from YAML.

    Example:
        config = load_site_config("airbnb")
    """

    base_dir = os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )

    config_path = os.path.join(
        base_dir,
        "config",
        f"{site_name}.yml"
    )


    print(
        f"Loading config: {config_path}"
    )


    with open(config_path, "r") as file:
        return yaml.safe_load(file)