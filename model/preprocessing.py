FEATURES = [
    "rating",
    "valueScore",
    "perNight",
    "bedrooms",
    "bathrooms",
    "reviews",
]

def prepare_features(df):
    print(df[FEATURES].isna().sum())
    df[FEATURES] = (
        df[FEATURES]
        .fillna(0)
    )

    return df