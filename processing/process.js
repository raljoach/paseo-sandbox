const fs = require("fs");
const path = require("path");
const { stringify } = require("csv-stringify/sync");
const { summarize } = require("../analysis/stats.js");
const { addFeatures } = require("../analysis/features.js");
const { createListing } = require("../common/listing");
const { createPrefix} = require('../common/metadata')

function processDirectory(directory) {
    const files = fs
        .readdirSync(directory)
        .filter(f => f.endsWith(".json"))
        .sort();

    console.log(`Found ${files.length} files`);

    for (const file of files) {
        processFile(path.join(directory, file));
    }
}

function processFile(file){
    const payload = JSON.parse(fs.readFileSync(file, "utf8"));
    return processPayload(payload);
}

function processPayload(payload) {
    const metadata = payload.metadata;
    let listings = payload.listings;
    const prefix = createPrefix(metadata)

    const uniqueRows = Array.from(
            new Map(
                listings.map(row => [
                    row.id,
                    row
                ])
            ).values()
        );
    
        console.log(
            `Removed ${listings.length - uniqueRows.length} duplicate listings`
        );
    
        listings = uniqueRows
    
        const rawJsonPath = path.join(
            __dirname,
            `../data/raw/${prefix}.json`
        );
    
        fs.writeFileSync(
            rawJsonPath,
            JSON.stringify({
                metadata,
                listings: listings
            }, null, 2)
        );
    
        const rawCsv = stringify(listings, {
            header: true
        });
    
        fs.writeFileSync(
            path.join(__dirname, `../data/raw/${prefix}.csv`),
            rawCsv
        );
    
        console.log(`Saved raw ${listings.length} listings`);
    
        console.log(
            "Missing ratings:",
            listings.filter(r => !r.rating).length
        );
    
        console.log(
            "Missing reviews:",
            listings.filter(r => !r.reviews).length
        );
    
        console.log(
            "Missing price:",
            listings.filter(r => !r.price).length
        );
    
        console.log(
            "Missing per night:",
            listings.filter(r => !r.perNight).length
        );
    
        console.log(
            "Missing bedrooms:",
            listings.filter(r => !r.bedrooms).length
        );
    
        console.log(
            "Missing bathrooms:",
            listings.filter(r => !r.bathrooms).length
        );
    
        console.log(
            "Missing lat long:",
            listings.filter(r => !r.latitude || !r.longitude).length
        );
    
    
        const stats = summarize(listings);
    
        console.log(stats);
    
        let featuredRows = listings.map(addFeatures);
        console.log(featuredRows[0]);

        // featuredRows =
        //     featuredRows.map(createListing);
        fs.writeFileSync(
            `./data/processed/${prefix}_features.json`,
            JSON.stringify({
                metadata,
                listings: featuredRows
            }, null, 2)
        );
    
         const featuredCsv = stringify(featuredRows, {
            header: true
        });
    
        fs.writeFileSync(
            path.join(__dirname, `../data/processed/${prefix}_features.csv`),
            featuredCsv
        );
    
        const dashboardRows = featuredRows
            .sort((a,b)=>b.valueScore-a.valueScore);
    
        console.table(
            dashboardRows.slice(0,10).map((x, i) => ({
                rank: i + 1,
                title: (x.title ?? "").substring(0,35),
                price: `$${x.perNight}`,
                rating: x.rating,
                reviews: x.reviews,
                beds: x.bedrooms,
                baths: x.bathrooms,
                score: x.valueScore.toFixed(4)
            }))
        );
    
        dashboardRows.slice(0,10).forEach((x, i) => {
            console.log(`
        ${i + 1}. ${x.description}
        ⭐ ${x.rating} (${x.reviews} reviews)
        💰 $${x.perNight}/night
        🛏 ${x.bedrooms} bedrooms, ${x.bathrooms} bathrooms
        📊 Score: ${x.valueScore.toFixed(4)}
        🔗 ${x.url}
        `);
        });
    
        const rankedJsonPath =
            path.join(
            __dirname,
            `../data/output/${prefix}_ranked.json`
        );
    
        fs.writeFileSync(
            rankedJsonPath,
            JSON.stringify({
                metadata,
                listings: dashboardRows
            }, null, 2)
        );
    
    
        const rankedCsv = stringify(dashboardRows, {
            header: true
        });
    
        fs.writeFileSync(
            path.join(__dirname, `../data/output/${prefix}_ranked.csv`),
            rankedCsv
        );
    
        console.log(`Saved ranked ${dashboardRows.length} listings`);
        console.log(rankedJsonPath);
        return rankedJsonPath
}


module.exports = {
    processDirectory,
    processFile,
    processPayload
};