function formatTimestamp(scrapedAt) {
    return new Date(scrapedAt)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "");
}

function createPrefix(metadata) {
    const timestamp =
        formatTimestamp(metadata.scrapedAt);

    return [
        metadata.source,
        metadata.city,
        metadata.country,
        timestamp
    ]
    .filter(Boolean)
    .join("_");
}

module.exports = {
    createPrefix
};