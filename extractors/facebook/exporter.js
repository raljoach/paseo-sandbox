const fs = require("fs");
const path = require("path");


function getOutputDir({site, source}) {

    return path.join(
        __dirname,
        "../../data/rent",
        source,
        site
    );

}


function writeJson(rows, file) {

    fs.writeFileSync(
        file,
        JSON.stringify(rows, null, 2),
        "utf8"
    );

    console.log(
        `✅ JSON written: ${file}`
    );
}


function writeCsv(rows, file) {

    if (!rows.length)
        return;


    const headers = Object.keys(rows[0]);

    const csvRows = rows.map(row =>
        headers.map(header => {

            const value = row[header] ?? "";

            return `"${String(value)
                .replace(/"/g, '""')}"`;

        }).join(",")
    );


    const csv = [
        headers.join(","),
        ...csvRows
    ].join("\n");


    fs.writeFileSync(
        file,
        csv,
        "utf8"
    );


    console.log(
        `✅ CSV written: ${file}`
    );

}


function exportRows(rows, context) {

    const {
        site,
        source,
        stage
    } = context;


    const dir = getOutputDir({
        site,
        source
    });


    fs.mkdirSync(
        dir,
        {
            recursive:true
        }
    );


    writeJson(
        rows,
        path.join(
            dir,
            `${site}_${stage}.json`
        )
    );


    writeCsv(
        rows,
        path.join(
            dir,
            `${site}_${stage}.csv`
        )
    );

}


module.exports = {
    exportRows,
    writeJson,
    writeCsv
};