function getRatingBucket(rating) {
    if (!rating) {
        return "unknown";
    }

    if (rating >= 5.0) {
        return "5.0";
    }

    if (rating >= 4.9) {
        return "4.9";
    }

    if (rating >= 4.8) {
        return "4.8";
    }

    if (rating >= 4.7) {
        return "4.7";
    }

    return "below";
}


function valueScore(listing) {
    if (!listing.rating || !listing.perNight) {
        return 0;
    }

    return listing.rating / listing.perNight;
}


function addFeatures(listing) {

    listing.ratingBucket = getRatingBucket(listing.rating);

    listing.valueScore = valueScore(listing);

    return listing;
}


module.exports = {
    addFeatures,
    getRatingBucket,
    valueScore
};