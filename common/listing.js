function createListing({

    id,
    source,

    url,

    title,
    address,
    neighborhood,

    latitude = null,
    longitude = null,

    monthlyRent = null,
    nightlyRent = null,

    bedrooms = null,
    bathrooms = null,

    propertySize = null,

    rating = null,
    reviewCount = null,

    amenities = [],

    images = [],

    raw = {}

}) {

    return {

        id,

        source,

        url,

        title,

        address,

        neighborhood,

        latitude,
        longitude,

        monthlyRent,
        nightlyRent,

        bedrooms,
        bathrooms,

        propertySize,

        rating,
        reviewCount,

        amenities,

        images,

        raw

    };

}

module.exports = {
    createListing
};