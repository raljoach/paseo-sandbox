function summarize(listings) {

    const prices = listings.map(x => x.perNight);

    return {

        count: listings.length,

        minPrice: Math.min(...prices),

        maxPrice: Math.max(...prices),

        averagePrice:
            prices.reduce((a,b)=>a+b,0) / prices.length

    };

}

module.exports = { summarize };