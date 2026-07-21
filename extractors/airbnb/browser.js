const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { createSearchUrl } = require("./searchUrl");
const { createPrefix} = require('../../common/metadata')


function writeFile(payload){
    const prefix =
        createPrefix(payload.metadata);

    const filename =
        `${prefix}.json`;

    const inputDir =
        path.join(__dirname, "../../data/input");

    fs.mkdirSync(inputDir, {
        recursive: true
    });

    const outputFile =
        path.join(inputDir, filename);

    fs.writeFileSync(
        outputFile,
        JSON.stringify(payload,null,2)
    );

    console.log(
        `Saved ${outputFile}`
    );

    return outputFile;
}
async function run() {
    const args = process.argv.slice(2);
    const [
        destination,
        checkin,
        checkout,
        flex
    ] = args;
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
        headless: false
    });

    const page = await browser.newPage();
    page.on("console", msg => {
        console.log("BROWSER:", msg.text());
    });
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

    let payload = await page.evaluate(async (code) => {

        // execute extractor.js INSIDE Chrome
        eval(code);

        // extractor.js created extract()
        return await extract();

    }, extractorCode);
    await browser.close();
    outputFile = writeFile(payload);
    console.log(outputFile);
}

run().catch(console.error);