from model.models.registry import get_model


ID_COLUMN = {
                "name": "ID",
                "id": "idLink",
                "presentation": "markdown",
            }
DESCRIPTION_COLUMN = {"name":"Description","id":"description"}
BASE_COLUMNS = [ID_COLUMN, DESCRIPTION_COLUMN]


SHORT_TERM_COLUMNS = [
    {"name":"Rating","id":"rating"},
    {"name":"Reviews","id":"reviews"},
    {"name":"$/night","id":"perNight"}
]

LONG_TERM_COLUMNS = [
    {"name":"Rent","id":"monthlyRent"},
    {"name":"Size","id":"propertySize"},
    # {"name":"Type","id":"propertyType"},
    #{"name":"City","id":"city"},
]

INTRINSIC_COLUMNS =[
    {"name":"Rooms","id":"bedrooms"},
    {"name":"Baths","id":"bathrooms"},
    #{"name":"Size","id":"size"},
    #{"name":"Lat/Long","id":"location"},
    #{"name":"City","id":"city"},
    #{"name":"Country","id":"country"}
]

def get_table_columns(is_short_term, model_name):
    model = get_model(model_name)

    listing_columns = (
        SHORT_TERM_COLUMNS
        if is_short_term
        else LONG_TERM_COLUMNS
    )

    return (
        BASE_COLUMNS
        + listing_columns
        + INTRINSIC_COLUMNS
        + model.model_columns()
    )