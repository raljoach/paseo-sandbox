///////////////////////////////////////////////////////////////
// FazWaz Extractor
///////////////////////////////////////////////////////////////

const delay = ms => new Promise(r => setTimeout(r, ms));


///////////////////////////////////////////////////////////////
// Helpers
///////////////////////////////////////////////////////////////


function extractMarketplaceId(url){

    if(!url)
        return null;

    const m =
        url.match(/(\d+)(?:\/)?$/);

    return m
        ? m[1]
        : null;
}


function extractPrice(text){

    const m =
        text.match(
            /COP\s*([\d.,]+)/i
        );

    if(!m)
        return null;

    return Number(
        m[1]
        .replace(/\./g,"")
        .replace(/,/g,"")
    );
}


function extractBedrooms(text){

    let m =
        text.match(
            /(\d+)\s*(?:bedrooms?|beds?|habitaciones?)/i
        );

    return m
        ? Number(m[1])
        : null;
}


function extractBathrooms(text){

    let m =
        text.match(
            /(\d+)\s*(?:bathrooms?|baths?|baños?)/i
        );

    return m
        ? Number(m[1])
        : null;
}


function extractPropertyType(text){

    const types = [

        "House",
        "Apartment",
        "Villa",
        "Condo",
        "Penthouse",
        "Townhouse",
        "Studio"

    ];


    return types.find(t =>
        text
        .toLowerCase()
        .includes(
            t.toLowerCase()
        )
    ) || null;

}


function extractTitle(text){

    const lines =
        text
        .split("\n")
        .map(x=>x.trim())
        .filter(Boolean);


    for(const line of lines){

        if(/^COP/i.test(line))
            continue;

        if(
            /\d+\s*(bed|bath|bedroom|bathroom)/i
            .test(line)
        )
            continue;


        if(
            /medell[ií]n|antioquia|colombia/i
            .test(line)
        )
            continue;


        return line;

    }


    return null;

}



function extractLocation(text){

    const lines =
        text
        .split("\n")
        .map(x=>x.trim())
        .filter(Boolean);


    return lines.at(-1) || null;

}



function extractImages(card){

    return [
        ...card.querySelectorAll("img")
    ]
    .map(img =>
        img.src
    )
    .filter(Boolean);

}



///////////////////////////////////////////////////////////////
// Card parser
///////////////////////////////////////////////////////////////


function parseCard(card){


    const text =
        card.innerText;


    const url =
        card.href;


    return {


        id:
            extractMarketplaceId(url),


        url,


        title:
            extractTitle(text),


        monthlyRent:
            extractPrice(text),


        bedrooms:
            extractBedrooms(text),


        bathrooms:
            extractBathrooms(text),


        propertyType:
            extractPropertyType(text),


        location:
            extractLocation(text),


        images:
            extractImages(card),


        rawText:
            text

    };


}


///////////////////////////////////////////////////////////////
// FazWaz card parser
///////////////////////////////////////////////////////////////
function parseFazwazPrice(price){

    if(!price)
        return null;


    const m =
        price.match(/([\d.,]+)/);


    if(!m)
        return null;


    return Number(
        m[1]
        .replace(/\./g,"")
        .replace(/,/g,"")
    );

}



function parseFazwazArea(area){

    if(!area)
        return null;


    const m =
        area.match(/([\d.]+)\s*SqM/i);


    if(!m)
        return null;


    return {

        value:
            Number(m[1]),

        unit:
            "m2"

    };

}



function extractImages(card){

    return [
        ...card.querySelectorAll("img")
    ]
    .map(img =>
        img.src
    )
    .filter(Boolean);

}

function extractCardData(card){

    const raw =
        card.getAttribute("onmouseenter");

    if(!raw)
        return null;


    // Extract JSON object from HTML encoded attribute
    const jsonMatch =
        raw.match(/'({.*})'/);


    if(!jsonMatch)
        return null;


    let data;


    try {

        const decoded =
            jsonMatch[1]
                .replace(/&quot;/g,'"')
                .replace(/\\\//g,'/');


        data =
            JSON.parse(decoded);

    }
    catch(e){

        console.log(
            "JSON parse failed",
            e
        );

        return null;

    }


    return {

        id:
            card.dataset.id,

        url:
            data.detailUrl,

        title:
            data.name,

        monthlyRent:
            parseFazwazPrice(data.price),

        bedrooms:
            data.bedrooms,

        bathrooms:
            data.bathrooms,

        propertyType:
            data.propertyType,

        location:
            data.formatted_address,

        propertySize:
            parseFazwazArea(data.area),

        images:
            extractImages(card),

        rawText:
            card.innerText

    };

}


///////////////////////////////////////////////////////////////
// Current page
///////////////////////////////////////////////////////////////


function extractVisibleCards(){

    const cards = [
        ...document.querySelectorAll(
            'div[data-tk="unit-result"]'
        )
    ];


    return cards
        .map(extractCardData)
        .filter(Boolean);

}


///////////////////////////////////////////////////////////////
// Pagination
///////////////////////////////////////////////////////////////

function nextButton(){

    return document.querySelector(
        'a[aria-label="Next"]'
    );

}


function getFirstListingId(){

    const card =
        document.querySelector(
            '[data-tk="unit-result"]'
        );

    return card?.dataset?.id || null;

}


async function gotoNextPage(){

    const link =
        nextButton();


    if(!link)
        return false;


    const oldId =
        getFirstListingId();


    console.log(
        "Current first listing:",
        oldId
    );


    link.click();


    // wait for new results
    for(let i=0;i<150;i++){

        await delay(100);


        const newId =
            getFirstListingId();


        if(
            newId &&
            newId !== oldId
        ){

            console.log(
                "New page loaded:",
                newId
            );

            break;
        }

    }


    await delay(2000);


    return true;

}



///////////////////////////////////////////////////////////////
// Extract all pages
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


        rows.forEach(r=>{


            listings.set(
                r.id || r.url,
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

        if(page > 333){
            console.log('Too many pages....')
            break;
        }
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
        `fazwaz_${Date.now()}.json`;


    a.click();

}



///////////////////////////////////////////////////////////////
// Run
///////////////////////////////////////////////////////////////


(async()=>{


    const rows =
        await extractAllPages();


    console.log(rows);


    downloadJSON(rows);

    //console.log(extractVisibleCards());


})();