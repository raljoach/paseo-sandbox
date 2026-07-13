function extractTitle(text) {

    const lines = text
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);


    // remove last line because it is location
    lines.pop();


    for (const line of lines) {


        // skip badges
        if (/just listed/i.test(line))
            continue;


        // skip prices
        if (/^COP/i.test(line))
            continue;


        // skip "3 habitaciones 2 baños Casa"
        if (
            /^\d+\s*(habitaciones?|beds?).*(baños?|baths?)/i.test(line)
        )
            continue;


        return line;
    }


    return null;
}

function hasFurnished(text){

    return /amoblad|amueblad|furnished/i.test(text);

}

function hasParking(text){

    return /parqueadero|garaje|garage|parking/i.test(text);

}

function petsAllowed(text){

    return /mascotas|pet friendly|se aceptan mascotas/i.test(text);

}

function hasBalcony(text){

    return /balc[oó]n/i.test(text);

}

function hasElevator(text){

    return /ascensor/i.test(text);

}

function extractSquareMeters(text){

    const m = text.match(
        /(\d+)\s*(?:m²|m2|mt2|metros?)/i
    );

    return m
        ? Number(m[1])
        : null;

}

function extractPrice(text) {

    const m = text.match(/COP\s*([\d.,]+)/i);

    if (!m) return null;

    return Number(
        m[1].replace(/\./g, "").replace(/,/g, "")
    );
}

function extractBedrooms(text) {

    let m =
        text.match(/(\d+)\s*habitaciones?/i);

    if (!m)
        m = text.match(/(\d+)\s*beds?/i);

    return m ? Number(m[1]) : null;
}

function extractBathrooms(text) {

    let m =
        text.match(/(\d+)\s*baños?/i);

    if (!m)
        m = text.match(/(\d+)\s*baths?/i);

    return m ? Number(m[1]) : null;
}

function extractPropertyType(text){

    const types = [

        "Casa",
        "Apartamento",
        "Apartaestudio",
        "Departamento",
        "Habitación",
        "House",
        "Condominio"

    ];

    return types.find(t =>
        text.toLowerCase().includes(
            t.toLowerCase()
        )
    ) || null;
}

function extractLocation(text){

    const lines =
        text.split("\n")
            .map(x=>x.trim())
            .filter(Boolean);

    return lines.at(-1);
}

function extractMarketplaceId(url){

    const m =
        url.match(/item\/(\d+)/);

    return m ? m[1] : null;
}



function parseCard(card) {

    const text = card.innerText;
    // console.log('CARD innerText: \n', text);
    return {
        id: extractMarketplaceId(card.href),
        url: card.href,
        rawText: text,

        monthlyRent: extractPrice(text),
        bedrooms: extractBedrooms(text),
        bathrooms: extractBathrooms(text),
        propertyType: extractPropertyType(text),
        city: extractLocation(text),
        // neighborhood: extractNeighborhood(text),
        isFurnished: hasFurnished(text), 
        hasParking: hasParking(text),
        allowsPets: petsAllowed(text),
        hasBalcony: hasBalcony(text),
        hasElevator: hasElevator(text),
        propertySize: extractSquareMeters(text),
        title: extractTitle(text)
    };
}

async function extractVisibleCards() {

    const cards = [
        ...document.querySelectorAll('a[href*="/marketplace/item/"]')
    ];

    const rows = cards.map(parseCard);
    return rows;
}

// async function scrollMarketplace() {

//     const before = document.querySelectorAll(
//         'a[href*="/marketplace/item/"]'
//     ).length;


//     window.scrollBy({
//         top: 1500,
//         behavior: "smooth"
//     });


//     await new Promise(r => setTimeout(r, 3000));


//     const after = document.querySelectorAll(
//         'a[href*="/marketplace/item/"]'
//     ).length;


//     console.log(
//         "Cards before:",
//         before,
//         "after:",
//         after
//     );


//     return after > before;
// }
async function scrollToBottom() {

    const before = document.querySelectorAll(
        'a[href*="/marketplace/item/"]'
    ).length;

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });

    const timeout = Date.now() + 10000;

    while (Date.now() < timeout) {

        await new Promise(r => setTimeout(r, 500));

        const after = document.querySelectorAll(
            'a[href*="/marketplace/item/"]'
        ).length;

        if (after > before)
            return true;
    }

    return false;
}

async function scrollMarketplace(){
    let failedScrolls = 0;
    while (failedScrolls < 5) {
        const loaded = await scrollToBottom();
        return loaded;
        if (loaded)
            failedScrolls = 0;
        else
            failedScrolls++;
    }
}

async function extractAllCards() {
    const listings = new Map();
    let noGrowth = 0;
    while(noGrowth < 5) {
        const rows = await extractVisibleCards();
        rows.forEach(r => {
            if(r.id) {
                listings.set(r.id, r);
            }
        });

        console.log(
            "Total listings:",
            listings.size
        );
        const grew = await scrollMarketplace();
        if(!grew) {
            noGrowth++;
        }
        else {
            noGrowth = 0;
        }

    }
    return [...listings.values()];
}
function output(rows){

    /* ---------------- JSON ---------------- */

    const jsonFilename = `facebook_listings_${Date.now()}.json`;

    const json = JSON.stringify(rows, null, 2);

    const jsonBlob = new Blob(
        [json],
        { type: "application/json" }
    );

    const jsonUrl = URL.createObjectURL(jsonBlob);

    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = jsonFilename;

    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);

    console.log("✅ JSON downloaded:", jsonFilename);


    /* ---------------- CSV ---------------- */

    setTimeout(() => {

        const csvFilename = `facebook_listings_${Date.now()}.csv`;

        const headers = Object.keys(rows[0]);

        const csvRows = rows.map(obj =>
            headers.map(h => {

                const val = obj[h] ?? "";

                return `"${String(val)
                    .replace(/"/g, '""')}"`;

            }).join(",")
        );


        const csv = [
            headers.join(","),
            ...csvRows
        ].join("\n");


        const csvBlob = new Blob(
            [csv],
            { type:"text/csv" }
        );

        const csvUrl = URL.createObjectURL(csvBlob);

        const csvLink = document.createElement("a");

        csvLink.href = csvUrl;
        csvLink.download = csvFilename;

        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);


        console.log("✅ CSV downloaded:", csvFilename);


    }, 1000);
    return jsonFilename
}
function clean(file){
    let rows = JSON.parse(
        fs.readFileSync(file)
    );

    rows = removeDuplicates(rows);

    rows = removeMissingPrice(rows);

    rows = removeMissingTitle(rows);

    rows = removeSales(rows);

    rows.forEach(r=>{

        r.title = normalizeTitle(r.title);

        r.city = normalizeCity(r.city);

    });

    rows.sort(

        (a,b)=>a.monthlyRent-b.monthlyRent

    );

    const issues = validate(rows);

    console.log(rows.length);
    console.log(issues.length);

    fs.writeFileSync(
        "cleaned_listings.json",
        JSON.stringify(rows,null,2)
    );
}
// chrome runner
(async () => {

    const rows = await extractAllCards();

    console.log(
        "Extracted listings:",
        rows.length
    );

    const jsonFile = output(rows);
    clean(jsonFile)
})();