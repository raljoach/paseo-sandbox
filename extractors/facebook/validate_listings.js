const fs = require("fs");

const filename = process.argv[2];

if (!filename) {
    console.log("Usage: node validate_listings.js facebook_listings.json");
    process.exit(1);
}

const listings = JSON.parse(
    fs.readFileSync(filename, "utf8")
);

console.log(
    `Loaded ${listings.length} listings`
);


const issues = [];


/*
1. Missing required fields
*/

listings.forEach((r, index) => {

    if (!r.id)
        issues.push({
            index,
            issue: "Missing marketplace id",
            row: r
        });


    if (!r.url)
        issues.push({
            index,
            issue: "Missing url",
            row: r
        });


    if (!r.title)
        issues.push({
            index,
            issue: "Missing title",
            row: r
        });


    if (!r.city)
        issues.push({
            index,
            issue: "Missing city",
            row: r
        });

});



/*
2. Suspicious prices
*/

listings.forEach((r,index)=>{

    if (!r.monthlyRent)
        return;


    // too cheap
    if (r.monthlyRent < 100000) {

        issues.push({
            index,
            issue:"Suspiciously cheap price",
            price:r.monthlyRent,
            title:r.title
        });

    }


    // probably sale price
    if (r.monthlyRent > 10000000) {

        issues.push({
            index,
            issue:"Possible sale listing instead of rent",
            price:r.monthlyRent,
            title:r.title
        });

    }

});



/*
3. Location validation
*/

const validCities = [
    "Medellín",
    "Medellin",
    "Envigado",
    "Itagüí",
    "Itagui",
    "Bello",
    "Sabaneta",
    "Rionegro",
    "Guarne",
    "Marinilla"
];


listings.forEach((r,index)=>{

    if (!validCities.some(
        c => r.city.includes(c)
    )) {

        issues.push({
            index,
            issue:"Unknown city",
            city:r.city,
            title:r.title
        });

    }

});



/*
4. Duplicate marketplace IDs
*/

const ids = new Map();


listings.forEach((r,index)=>{

    if (!r.id)
        return;


    if(ids.has(r.id)){

        issues.push({
            index,
            issue:"Duplicate listing id",
            id:r.id,
            title:r.title
        });

    }

    ids.set(r.id,index);

});



/*
5. Duplicate titles
*/

const titles = new Map();


listings.forEach((r,index)=>{

    if(!r.title)
        return;


    const key =
        r.title
        .toLowerCase()
        .trim();


    if(titles.has(key)){

        issues.push({
            index,
            issue:"Duplicate title",
            title:r.title
        });

    }


    titles.set(key,index);

});



/*
6. Check raw extraction
*/

listings.forEach((r,index)=>{

    if(
        r.rawText &&
        r.title &&
        !r.rawText.includes(r.title)
    ){

        issues.push({
            index,
            issue:"Title not found in raw text",
            title:r.title
        });

    }

});



/*
OUTPUT
*/


console.log(
    "\nValidation complete"
);


console.log(
    "Issues found:",
    issues.length
);


fs.writeFileSync(
    "validation_report.json",
    JSON.stringify(
        issues,
        null,
        2
    )
);


console.log(
    "Created validation_report.json"
);