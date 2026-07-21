const { URL } = require("url");

function destinationToSlug(destination) {
    return destination
        .split(",")
        .map(s => s.trim())
        .join("--")
        .replace(/\s+/g, "-");
}

function createSearchUrl({
    destination,
    checkin = null,
    checkout = null,
    flex = 0,
    locale = "en",
    countryOverride = "US",
    currency = "USD",
}) {

    const slug = destinationToSlug(destination);

    const url = new URL(
        `https://www.airbnb.com/s/${slug}/homes`
    );

    url.searchParams.set("locale", locale);
    url.searchParams.set("country_override", countryOverride);
    url.searchParams.set("currency", currency);

    url.searchParams.set("query", destination);

    url.searchParams.set("search_mode", "regular_search");
    url.searchParams.set("channel", "EXPLORE");
    url.searchParams.set("date_picker_type", "calendar");

    url.searchParams.append(
        "refinement_paths[]",
        "/homes"
    );

    //
    // Only include dates if supplied
    //
    if (checkin)
        url.searchParams.set("checkin", checkin);

    if (checkout)
        url.searchParams.set("checkout", checkout);

    //
    // Flexible search
    //
    if (checkin && checkout && flex > 0) {
        url.searchParams.set(
            "flexible_date_search_filter_type",
            "6"
        );
    }

    return url.toString();
}

module.exports = {
    createSearchUrl
};