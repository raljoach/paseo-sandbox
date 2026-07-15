///////////////////////////////////////////////////////////////
// Rentberry Extractor
///////////////////////////////////////////////////////////////

const delay = ms => new Promise(r => setTimeout(r, ms));

///////////////////////////////////////////////////////////////
// Helpers
///////////////////////////////////////////////////////////////

function parsePrice(label) {

    const m = label.match(
        /Price:\s*COP\s*([\d.,]+)\s*([MK]?)/i
    );

    if (!m)
        return null;

    let value = parseFloat(
        m[1].replace(",", ".")
    );

    const suffix = m[2].toUpperCase();

    if (suffix === "M")
        value *= 1000000;

    if (suffix === "K")
        value *= 1000;

    return Math.round(value);

}

function parseBedrooms(label) {
    return Number(
        label.match(/(\d+)\s+bedrooms?/i)?.[1]
    ) || null;
}

function parseBathrooms(label) {
    return Number(
        label.match(/(\d+)\s+baths?/i)?.[1]
    ) || null;
}

function parseSize(label){

    let m = label.match(/([\d,]+)\s*Sq\s*M/i);

    if(m){
        return {
            value:
                Number(m[1].replace(",","")),
            unit:"m2"
        };
    }


    m = label.match(/([\d,]+)\s*Sq\s*Ft/i);

    if(m){
        return {
            value:
                Number(m[1].replace(",","")),
            unit:"ft2"
        };
    }


    return null;
}

function parseAddress(label) {

    return label
        .split(". Price:")[0]
        .trim();

}

function parseImages(card) {

    return [
        ...card.querySelectorAll("img")
    ]
    .map(x => x.src)
    .filter(Boolean);

}

function parseAmenities(card){

    const items = [
        ...card.querySelectorAll(".labels__item")
    ]
    .map(x => x.innerText.trim());

    return items.filter(x =>
        !/^\d+$/.test(x) &&
        !/Sq M/i.test(x) &&
        !/Sq Ft/i.test(x) &&
        !/Apartment|House/i.test(x)
    );

}

function parseUrl(card){

    const links = [
        ...card.querySelectorAll("a[href]")
    ];

    const link = links.find(a =>
        a.href.includes("rentberry.com")
    );

    return link?.href ?? null;
}

function parseId(url){

    if (!url)
        return null;

    const match =
        url.match(/\/(?:[^/]+)\/(\d+)-/);

    return match ? match[1] : null;
}

///////////////////////////////////////////////////////////////
// Card parser
///////////////////////////////////////////////////////////////

function parseCard(card){

    const label =
        card.getAttribute("aria-label") || "";

    const url =
        parseUrl(card);

    const title =
        parseAddress(label);

    return {

        id: parseId(url),

        url,

        title,

        address:
            title,

        monthlyRent:
            parsePrice(label),

        bedrooms:
            parseBedrooms(label),

        bathrooms:
            parseBathrooms(label),

        propertySize:
            parseSize(label),

        amenities:
            parseAmenities(card),

        images:
            parseImages(card),

        rawText:
            card.innerText

    };

}

///////////////////////////////////////////////////////////////
// Visible cards
///////////////////////////////////////////////////////////////

function extractVisibleCards(){

    const cards = [

        ...document.querySelectorAll(
            "section.property-card"
        )

    ];

    return cards

        .map(parseCard)

        .filter(x =>

            x.monthlyRent &&
            x.title &&
            !x.rawText.includes(
                "Renters insurance"
            ) &&
            !x.rawText.includes(
                "Protect Your Belongings"
            )

        );

}

///////////////////////////////////////////////////////////////
// Pagination
///////////////////////////////////////////////////////////////

function nextButton() {
    return document.querySelector(
        'a.pagination-item[aria-label="Go to next page"]:not([aria-disabled="true"])'
    );
}

async function gotoNextPage() {

    const link = nextButton();

    if (!link)
        return false;

    const oldUrl = location.href;

    // Click the link
    link.click();

    // Wait until the URL changes
    for (let i = 0; i < 100; i++) {

        await delay(100);

        if (location.href !== oldUrl)
            break;
    }

    // Wait for Angular to render the new listings
    await delay(3000);

    return true;
}

///////////////////////////////////////////////////////////////
// Main extractor
///////////////////////////////////////////////////////////////

async function extractAllPages(){

    const listings =
        new Map();

    let page = 1;

    while(true){

        console.log(
            "Page",
            page
        );

        await delay(1000);

        const rows =
            extractVisibleCards();

        rows.forEach(r => {

            listings.set(
                r.id,
                r
            );

        });

        console.log(
            "Listings:",
            listings.size
        );

        const moved =
            await gotoNextPage();

        if(!moved)
            break;

        page++;

    }

    return [
        ...listings.values()
    ];

}

///////////////////////////////////////////////////////////////
// Download
///////////////////////////////////////////////////////////////

function downloadJSON(rows){

    const blob =
        new Blob(

            [
                JSON.stringify(
                    rows,
                    null,
                    2
                )
            ],

            {
                type:
                    "application/json"
            }

        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href =
        url;

    a.download =
        `rentberry_${Date.now()}.json`;

    a.click();

}

///////////////////////////////////////////////////////////////
// Run
///////////////////////////////////////////////////////////////

(async () => {

    const rows =
        await extractAllPages();

    console.log(rows);

    downloadJSON(rows);

})();