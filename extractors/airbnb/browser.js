const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { stringify } = require("csv-stringify/sync");
const { score } = require("./scorer");
const { summarize } = require("../../analysis/stats");
const { addFeatures } = require("../../analysis/features");
const { createSearchUrl } = require("./searchUrl");
const { processRows } = require("./process");

async function run() {
    const args = process.argv.slice(2);

    const fromFile = args.includes("--from-file");

    if (fromFile) {

        console.log(
            "Processing existing extractor output..."
        );


        const rows = JSON.parse(
            fs.readFileSync(
                path.join(
                    __dirname,
                    "../../data/input/airbnb_listings_1783883713465.json"
                )
            )
        );


        processRows(rows);

        return;
    }

    const [
    destination,
    checkin,
    checkout,
    flex
    ] = args.filter(x => x !== "--from-file");


    if (!destination) {
        console.error(
            "Usage: node browser.js <destination> [checkin] [checkout] [flex]"
        );
        process.exit(1);
    }

    console.log({
        destination,
        checkin,
        checkout,
        flex
    });

    const browser = await chromium.launch({
        headless: true
    });

    const page = await browser.newPage();
    // page.on("console", msg => {
    //     console.log("BROWSER:", msg.text());
    // });
    const flexDays = Number(flex || 0);

    const searchUrl = createSearchUrl({
        destination,
        checkin,
        checkout,
        flex: flexDays,
    });

    console.log('SEARCH URL: ', searchUrl);
    await page.goto(
        searchUrl,
        {
            waitUntil: "domcontentloaded",
            timeout: 120000
        }
    );

    await page.waitForSelector(
        '[data-testid="listing-card-title"]',
        { timeout: 60000 }
    );

    // await page.waitForFunction(() => {
    //     return document.body.innerText.includes("reviews");
    // }, {
    //     timeout: 60000
    // });

    const extractorCode = fs.readFileSync(
        path.join(__dirname, "extractor.js"),
        "utf8"
    );

    // await page.waitForTimeout(10000);

    let rows = await page.evaluate(async (code) => {

        // execute extractor.js INSIDE Chrome
        eval(code);

        // extractor.js created extract()
        return await extract();

    }, extractorCode);
    await browser.close();
    process(rows);

}

run().catch(console.error);