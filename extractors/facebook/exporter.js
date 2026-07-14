// exporter.js

const fs = require("fs");
const path = require("path");

function writeJson(rows, filename) {

    

    const file =
        path.join(__dirname, filename);

    fs.writeFileSync(
        file,
        JSON.stringify(rows, null, 2),
        "utf8"
    );

    console.log(
        `✅ JSON written: ${file}`
    );

}

function writeCsv(rows, filename) {

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

    

    const file =
        path.join(__dirname, filename);

    fs.writeFileSync(
        file,
        csv,
        "utf8"
    );

    console.log(
        `✅ CSV written: ${file}`
    );

}

function exportRows(rows, prefix, stage){
    writeJson(rows,`${prefix}_${stage}.json`);
    writeCsv(rows,`${prefix}_${stage}.csv`);
}

module.exports = {
    exportRows,
    writeJson,
    writeCsv
};