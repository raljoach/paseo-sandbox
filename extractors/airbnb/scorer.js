function valueScore(listing) {
    return listing.rating / Math.log(listing.perNight);
}

function popularityScore(listing) {
    return Math.log10(Math.max(listing.reviews, 1));
}

function comfortScore(listing) {
    const rooms =
        listing.bedrooms * 0.5 +
        listing.bathrooms * 0.3 +
        listing.beds * 0.2;

    return Math.log(rooms + 1);
}

function adjustedRating(listing) {

    const confidence = Math.min(listing.reviews / 50, 1);

    return (
        listing.rating * confidence +
        4.7 * (1-confidence)
    );
}

function score(listing) {

    const rating =
        adjustedRating(listing);

    const value =
        rating / Math.log(listing.perNight);

    const comfort =
        Math.log(
            listing.bedrooms * 0.5 +
            listing.bathrooms * 0.3 +
            listing.beds * 0.2 +
            1
        );

    listing.overallScore =
        value * 0.9 +
        comfort * 0.1;

    return listing;
}


module.exports = {
    score
};