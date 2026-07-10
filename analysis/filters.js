function filterListings(listings, options) {

    return listings.filter(l =>

        l.perNight <= options.maxNightlyPrice &&

        l.guestRating >= options.minRating &&

        l.reviews >= options.minReviews &&

        l.bedrooms >= options.minBedrooms &&

        l.bathrooms >= options.minBathrooms

    );

}

module.exports = { filterListings };