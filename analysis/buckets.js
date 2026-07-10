function ratingBucket(rating) {

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

    return "<4.7";
}


function applyRatingBucket(listing) {

    listing.ratingBucket = ratingBucket(
        listing.rating
    );

    return listing;
}


module.exports = {
    ratingBucket,
    applyRatingBucket
};