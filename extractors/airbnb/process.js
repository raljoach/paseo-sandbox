const fs = require("fs");
const path = require("path");
const { stringify } = require("csv-stringify/sync");
const { summarize } = require("../../analysis/stats");
const { addFeatures } = require("../../analysis/features");


function processRows(rows) {

    const uniqueRows = Array.from(
            new Map(
                rows.map(row => [
                    row.id,
                    row
                ])
            ).values()
        );
    
        console.log(
            `Removed ${rows.length - uniqueRows.length} duplicate listings`
        );
    
        rows = uniqueRows
    
        const rawJsonPath = path.join(
            __dirname,
            "../../data/raw/airbnb_medellin.json"
        );
    
        fs.writeFileSync(
            rawJsonPath,
            JSON.stringify(rows, null, 2)
        );
    
        const rawCsv = stringify(rows, {
            header: true
        });
    
        fs.writeFileSync(
            path.join(__dirname, "../../data/raw/airbnb_medellin.csv"),
            rawCsv
        );
    
        console.log(`Saved raw ${rows.length} listings`);
    
        console.log(
            "Missing ratings:",
            rows.filter(r => !r.rating).length
        );
    
        console.log(
            "Missing reviews:",
            rows.filter(r => !r.reviews).length
        );
    
        console.log(
            "Missing price:",
            rows.filter(r => !r.price).length
        );
    
        console.log(
            "Missing per night:",
            rows.filter(r => !r.perNight).length
        );
    
        console.log(
            "Missing bedrooms:",
            rows.filter(r => !r.bedrooms).length
        );
    
        console.log(
            "Missing bathrooms:",
            rows.filter(r => !r.bathrooms).length
        );
    
        console.log(
            "Missing lat long:",
            rows.filter(r => !r.latitude || !r.longitude).length
        );
    
    
        const stats = summarize(rows);
    
        console.log(stats);
    
        const featuredRows = rows.map(addFeatures);
        fs.writeFileSync(
            "./data/processed/airbnb_medellin_features.json",
            JSON.stringify(featuredRows, null, 2)
        );
    
         const featuredCsv = stringify(featuredRows, {
            header: true
        });
    
        fs.writeFileSync(
            path.join(__dirname, "../../data/processed/airbnb_medellin_features.csv"),
            featuredCsv
        );
    
        const dashboardRows = featuredRows
            .sort((a,b)=>b.valueScore-a.valueScore);
    
    
    
        console.table(
            dashboardRows.slice(0,10).map((x, i) => ({
                rank: i + 1,
                description: x.description.substring(0, 35),
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
    
        const scoredJsonPath = path.join(
            __dirname,
            "../../data/output/airbnb_medellin_ranked.json"
        );
    
        fs.writeFileSync(
            scoredJsonPath,
            JSON.stringify(dashboardRows, null, 2)
        );
    
    
        const scoredCsv = stringify(dashboardRows, {
            header: true
        });
    
        fs.writeFileSync(
            path.join(__dirname, "../../data/output/airbnb_medellin_ranked.csv"),
            scoredCsv
        );
    
        console.log(`Saved ranked ${dashboardRows.length} listings`);
}


module.exports = {
    processRows
};