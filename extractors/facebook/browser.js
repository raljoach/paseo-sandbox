const fs = require("fs");
const path = require("path");

const extractor = require("./extractor");
const cleaner = require("./cleaner");
const validator = require("./validator");
const exporter = require("./exporter");

async function main() {

    const args = process.argv.slice(2);
   
    let source = "short-term-stay";

    const sourceIndex = args.indexOf("--source");

    if(sourceIndex >= 0){
        source = args[sourceIndex + 1];
    }

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
    exporter.exportRows(
        rows,
        {
            site: 'facebook',
            source,
            stage: "raw"
        }
    );
    rows = cleaner.clean(rows);
    validator.validate(rows);

    exporter.exportRows(
        rows,
        {
            site: 'facebook',
            source,
            stage: "clean"
        }
    );


    exporter.exportRows(
        rows,
        {
            site: 'facebook',
            source,
            stage: "features"
        }
    );
    }

main().catch(console.error);