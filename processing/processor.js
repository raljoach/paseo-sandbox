const {
    processFile,
    processDirectory
} = require("./process");

const args = process.argv.slice(2);

const fromFile =
    args.indexOf("--from-file");

const fromDirectory =
    args.indexOf("--from-directory");

if(fromFile>=0){

    processFile(
        args[fromFile+1]
    );

    process.exit(0);
}

if(fromDirectory>=0){

    processDirectory(
        args[fromDirectory+1]
    );

    process.exit(0);
}

console.log(
`
Usage

node processing/processor.js \
    --from-file file.json

or

node processing/processor.js \
    --from-directory data/input
`
);