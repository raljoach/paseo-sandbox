import yaml


def load_schema(filename):

    with open(filename) as f:
        return yaml.safe_load(f)


def validate_row(row, schema):

    errors = []

    fields = schema["listing"]

    for field, rules in fields.items():

        if field not in row:
            continue

        value = row[field]

        expected = rules["type"]

        if value is None:
            continue

        if expected == "number":
            if not isinstance(value, (int,float)):
                errors.append(
                    f"{field}: expected number got {type(value)}"
                )

        if expected == "integer":
            if not isinstance(value, int):
                errors.append(
                    f"{field}: expected integer got {type(value)}"
                )

    return errors