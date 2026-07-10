function segmentByRating(rows) {

    const buckets = {};

    rows.forEach(row => {

        const bucket = row.ratingBucket;

        if (!buckets[bucket]) {
            buckets[bucket] = [];
        }

        buckets[bucket].push(row);

    });


    Object.keys(buckets).forEach(bucket => {

        buckets[bucket].sort(
            (a,b) =>
                b.valueScore - a.valueScore
        );

    });


    return buckets;
}


module.exports = {
    segmentByRating
};