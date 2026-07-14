const fs = require("fs");
const path = require("path");

const extractor = require("./extractor");
const cleaner = require("./cleaner");
const validator = require("./validator");
const exporter = require("./exporter");

async function main() {

    const args = process.argv.slice(2);

    let rows;

    const fromFileIndex = args.indexOf("-from-file");

    if (fromFileIndex >= 0) {

        const filename = args[fromFileIndex + 1];

        if (!filename) {
            throw new Error("Missing filename after -from-file");
        }

        const file = path.resolve(filename);

        console.log(`Loading ${file}`);

        rows = JSON.parse(
            fs.readFileSync(file, "utf8")
        );

    } else {

        console.log("Scraping Facebook...");

        rows = await extractor.extract();

    }
    exporter.exportRows(rows,'facebook', 'raw');
    rows = cleaner.clean(rows);
    validator.validate(rows);
    exporter.exportRows(rows,'facebook', 'clean');
}

main().catch(console.error);