function formula(perNight, rating, reviewCount, roomCount, bathCount){
  
  const result = 
  (
    rating + 
    //(reviewCount/205) + 
    (roomCount/3/10)  + 
    (bathCount/2/10)
  )
  /
  perNight;
  // console.log("DEBUG FORMULA: ",result, perNight, rating, reviewCount, roomCount, bathCount)
  return result;
}

function nullSwapForZero(text, specialValue=null){
 if(typeof text === "number") {
   return text;
 }
  if(!text || text.trim().length===0 || (specialValue && text.trim().toLowerCase().includes(specialValue))){
    return 0
  }
  return text;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomSleep(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(ms);
}

function zToPercentile(z) {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

// You’ll need erf (error function)
function erf(x) {
  // Approximation
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592,
        a2 = -0.284496736,
        a3 = 1.421413741,
        a4 = -1.453152027,
        a5 = 1.061405429,
        p = 0.3275911;

  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) *
              t * Math.exp(-x * x);

  return sign * y;
}

async function autoScroll(){
  /* ---------------- auto-scroll ---------------- */
    let lastHeight = 0;
    for (let i = 0; i < 12; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(1200);
      const h = document.body.scrollHeight;
      if (h === lastHeight) break;
      lastHeight = h;
    }
}

function clickNext(){
  const current = document.querySelector('button[aria-current="page"]');
  const next = current?.nextElementSibling;
  
  if (next && next.getAttribute('aria-label') !== 'Next') {
    next.click();
    return true;
  } else {
    return false
  }
}

async function proxyFetch(url, headers){
  // fetch(`https://cors-anywhere.herokuapp.com/${url}`, {
  //   headers: headers
  // }).then(res => {
  //   console.log('res: ', res)
  //   return res.text()
  // }).then(html => {
  //   console.log('html: ', html)
  // })
  return await fetch(`https://cors-anywhere.herokuapp.com/${url}`, {
    headers: headers
  })
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function reverseGeocode(lat, lon) {
  let retry = 0;
  const maxRetry = 3;
  while(retry < maxRetry){
    try {
      //console.log(getRandomInt(5, 15)); // e.g., 7, 12, 15
      // sleep(getRandomInt(3000, 5000))
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      console.log('geo url: ', url)
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json"
        }
      });
  
      const data = await res.json();
      const addr = data.address || {};
      console.log('ADDR: ', addr)
      const result = {
        city_district: addr.city_district || null,
        suburb: addr.suburb || null,
        neighborhood: addr.neighbourhood || null,
        city: addr.city || addr.town || addr.village || null,
        barrio: addr.neighbourhood || addr.suburb ||  addr.city_district || null,
        full: data.display_name
      };
  
      console.log("📍 Result:", result);
      return result;
  
    } catch (err) {
      ++retry
      console.error("Error", retry, ": ", err);
      sleepFor = 15000
      console.log('sleepFor: ', sleepFor)
      sleep(sleepFor)
      sleepFor+=1000
    }
  }
}

const resolveListingURL = (card) => {
  // 1) any anchor inside card
  let a = card.querySelector('a[href*="/rooms/"]');
  if (a) return a.href;

  // 2) walk upward to find wrapping anchor
  let el = card;
  while (el && el !== document.body) {
    if (el.tagName === 'A' && el.href.includes('/rooms/')) {
      return el.href;
    }
    a = el.querySelector?.('a[href*="/rooms/"]');
    if (a) return a.href;
    el = el.parentElement;
  }
  return '';
};

async function resolveListingDetails(url) {
  let retry = 0;
  const maxRetry = 3;
  while(retry < maxRetry){
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const scriptTag = doc.querySelector('#data-deferred-state-0');
    if (!scriptTag) return { reviews: [], /*nights: nights, price: priceText,*/ reviewRating: null, reviewCount: null, roomCount: null, bedsCount: null, bathCount: null, guestCount:null, metaData: null, wishlistId:null, wishlistItemId:null, title: null, description: null, checkin: null, checkout: null };

    const jsonData = JSON.parse(scriptTag.textContent);
    const result = { reviews: [], /*nights: nights, price: priceText,*/ reviewRating: null, reviewCount: null, roomCount: null, bedsCount: null, bathCount: null, guestCount:null, metaData: null, wishlistId: null, wishlistItemId: null, title: null, description: null, checkin: null, checkout: null};
    const notAvailable = []
    // Robust recursive search
    function search(obj) {
      if (!obj || typeof obj !== 'object') return;

      // REVIEW DATA

      if (obj.__typename === "CategoryRating" && obj.label && !Number.isNaN(Number(obj.label))){
        // console.log('Category label:', obj)
        if(!result.reviews.find(x=>x.label===obj.label)){
          result.reviews.push( 
            {
              label: obj.label,
              localizedRating: obj.localizedRating,
              percentage: obj.percentage
            }
          )
        }
      }
      if (obj.__typename === "PdpReviewsSectionReviewData" 
          && obj.reviewRating) {
        result.reviewRating = obj.reviewRating;
        access = obj.accessibilityLabel

        // console.log('access: ', access, access.split(' '))

        const tokens = access.replace('review.', '').trim().split(' from ')
        const lastToken = tokens[tokens.length-1]
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // remove accents
              .replace(/\u00A0/g, " "); // fix non-breaking space
        let splitWord = ' ';//' reseñas'
        // console.log('lastToken: ', lastToken, lastToken.includes(' reseñas'))
        // if(!lastToken.includes(' reseñas')){
        //   splitWord = ' reseña'
        //   console.log('no')
        // }
        // else{
        //   console.log('yes')
        // }
        const reviewCountToken = lastToken.split(splitWord)
        // console.log('reviewCountToken: ', reviewCountToken)
        const reviewCount = reviewCountToken[0].trim()
        result.reviewCount = reviewCount
      }

      // VARIABLES
      if(obj.variables && 
         obj.variables.pdpSectionsRequest){
        result.checkin = obj.variables.pdpSectionsRequest.checkin
        result.checkout = obj.variables.pdpSectionsRequest.checkout
      }

      // ROOM , BATH COUNT
      if (obj.__typename === "PdpSharingConfig" && obj.title) {
          // const roomBathLabel = obj.title
          // const roomMatch = roomBathLabel.match(/(\d+)\s*bedroom/i);
          // const bathMatch = roomBathLabel.match(/(\d+)\s*bath/i);
          // const roomCount = roomMatch ? Number(roomMatch[1]) : null;
          // const bathCount = bathMatch ? Number(bathMatch[1]) : null;
          const label = obj.title
          // console.log('✅ label: ', label)
          const parts = label.split('·')
          const parts_length = parts.length;
          // parts[0] // title
          // parts[1] // rating
          const roomsLabel = parts[parts_length-3].trim();
          const bedsLabel = parts[parts_length-2].trim();
          const bathsLabel = parts[parts_length-1].trim();

          const roomMatch = roomsLabel.match(/(\d+)\s*/i);
          const bedsMatch = bedsLabel.match(/(\d+)\s*/i);
          const bathMatch = bathsLabel.match(/(\d+)\s*/i);

          const roomCount = roomMatch ? Number(roomMatch[1]) : 0.5;
          const bedsCount = bedsMatch ? Number(bedsMatch[1]) : null;
          const bathCount = bathMatch ? Number(bathMatch[1]) : null;
          
        
          result.roomCount = roomCount
          result.bedsCount = bedsCount
          result.bathCount = bathCount
      }
      if (obj.icon === "SYSTEM_FAMILY" && obj.title) {
          const label = obj.title
          const guestsMatch = label.match(/(\d+)\s*/i);
          const guestCount = guestsMatch ? Number(guestsMatch[1]) : null;
          result.guestCount = guestCount
      }

      // Values
      if (obj.__typename === "PdpLoggingContext" && obj.eventDataLogging) {
          const data = obj.eventDataLogging
          result.metaData = data
      }

      // wishlistid
      if (obj.__typename === "WishlistItemEntityInfo" && obj.wishlistId) {
          result.wishlistId = obj.wishlistId
          result.wishlistItemId = obj.wishlistItemId
      }

      if (obj.__typename === "SectionDataContainer" && obj.sectionId && obj.sectionId === "OVERVIEW_DEFAULT_V2") {
          result.title = obj.sectionData.title
          // console.log('different title:', result.title)
      }

      if (obj.__typename === "PdpTitleSection" && obj.title) {
          result.description = obj.title
          // console.log('different description:', result.description)
      }

      if (obj.__typename === "Amenity" && obj.title && !obj.available) {
          notAvailable.push(obj.title)
          // console.log('not available amenity:', obj.title)
      }

      for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'object') search(value);
      }

      // If obj is an array, search its elements too
      if (Array.isArray(obj)) {
        obj.forEach(search);
      }
    }
    search(jsonData);
    const fruitSet = new Set(notAvailable); 
    result.notAvailable = [...fruitSet]
    return result;
  // } catch (err) {
  //   console.error("Error fetching review data:", err);
  //   return { reviewRating: null, reviewCount: null };
  } catch (err) {
      ++retry
      console.error("Error", retry, ": ", err);
      sleepFor = 15000
      console.log('sleepFor: ', sleepFor)
      sleep(sleepFor)
      sleepFor+=1000
    }
  }
  return { reviewRating: null, reviewCount: null };
}

async function processListingDetails(url){
  // COMMENTED OUT: TO SHORTEN EXECUTION TIME
      // --- ROOM PAGE FETCH
  // polite delay
          await sleep(1000);
        try {
          const result = await resolveListingDetails(url)
          // console.log("✅ ROOM PAGE FETCH RESULT ", result)
    
          // DUPE: already got from card
          rating = nullSwapForZero(result.reviewRating,"new")
          reviewCount = nullSwapForZero(result.reviewCount)
          roomsCount = result.roomCount
          bathCount = result.bathCount
          wishlistId = result.wishlistId
          wishlistItemId = result.wishlistItemId
          notAvailable = result.notAvailable;
          reviews = result.reviews;
    
          // Metadata
          data = result.metaData
          roomType = data.roomType
          lat = data.listingLat 
          long = data.listingLng
          listLoc = data.listingLat + ", " + data.listingLng
          accuracyRating = nullSwapForZero(data.accuracyRating)
          checkinRating = nullSwapForZero(data.checkinRating)
          cleanlinessRating = nullSwapForZero(data.cleanlinessRating)
          communicationRating = nullSwapForZero(data.communicationRating)
          locationRating = nullSwapForZero(data.locationRating)
          valueRating =nullSwapForZero(data.valueRating)
          guestSatisfactionOverall = nullSwapForZero(data.guestSatisfactionOverall)
          
    
          bedsCount = result.bedsCount;
          guestCount = result.guestCount;

          // DUPE from card
         // console.log("✅ Rating: ", rating)
         // console.log("✅ Review Count: ", reviewCount)
         // console.log("✅ Beds Count:", bedsCount);

          // Only in details
          // console.log("✅ Baths Count:", bathCount);
          // console.log("✅ Guests Count:", guestCount);

          
        } catch (e) {
          console.warn('Failed process listing page for', url, e.message);
        }
         
        
    
      // COMMENT: THESE REQUIRE resolveListingDetails
      // ROOM, BATH COUNt CALC
      // if (!Number.isNaN(Number(reviewCount))) {
      //   reviewCount = Number(reviewCount)
      // } else {
      //   reviewCount = 0
      // }
      
      // if (maxReviewCount < reviewCount) {
      //   maxReviewCount = reviewCount
      //   console.log("✅ Max Review Count: ", maxReviewCount)
      // }

      const guestRating =  
       (accuracyRating +
        checkinRating +
        cleanlinessRating +
        communicationRating +
        locationRating +
        valueRating +
        guestSatisfactionOverall)/7
      // console.log('✅ Guest Rating: ', guestRating)
      
      if(wishlistId){
        // console.log("✅ ❤️ ❤️❤️❤️❤️❤️ Wishlist ID: ", wishlistId, ' ', wishlistItemId)
      }
      return{
       roomsCount,
        //reviewCount,
        reviews,
        bathCount,
        bedsCount,
        guestCount,
        roomType,
        notAvailable,
        lat,
        long,
        accuracyRating,
        checkinRating,
        cleanlinessRating,
        communicationRating,
        locationRating,
        valueRating,
        guestSatisfactionOverall,
        //wishedFor,
        wishlistId,
        wishlistItemId,
        guestRating
      }
}

/*
  // ----------- CARD STRUCTURE -----------------
  // [ \_(:/)_/]  url                    (\/)       
  // title               rating (reviewCount)
  // description
  // price .... nights
  // ----------- CARD STRUCTURE -----------------
*/
async function parseCard(card) {
  const url = resolveListingURL(card);

  const promise_listing = processListingDetails(url)
  // const areaInfo = await resolveAreaDetails(lat, long)
  
  const id = url.match(/\/rooms\/(\d+)/)?.[1] || ''
  const checkInMatch = url.match(/[?&]check_in=([^&]+)/);
  const checkOutMatch = url.match(/[?&]check_out=([^&]+)/);
  const checkIn = checkInMatch ? checkInMatch[1] : null;
  const checkOut = checkOutMatch ? checkOutMatch[1] : null;
  const priceAvailabilityRow =
          card.querySelector('[data-testid="price-availability-row"]');
  const nextSibling = priceAvailabilityRow.nextSibling;
  //const ratingFullText = nextSibling.textContent.trim();
  
  // console.log("✅ ratingFullText:", ratingFullText)

  // let rating = null;
  // let reviewCount = 0
  // if(!ratingFullText || ratingFullText.trim().length===0 || ratingFullText.toLowerCase().includes('new')){
  //   rating = 0
  // }
  // else{
  //   if(!ratingFullText || ratingFullText.trim().length===0){
  //     console.log('🛑 url: ', url)
  //     console.log('🛑 priceAvailabilityRow: ', nextSibling)
  //     console.log('🛑 nextSibing: ', nextSibling)
  //   }
  //   const ratingText = ratingFullText.split('reviews')[1]
  //   console.log("✅ ratingText:", ratingText)
  //   const parts = ratingText.split("(")
  //   rating = Number(parts[0])
  //   reviewCount = Number(parts[1].replace(")",'').trim())
  // }

  const inWishList = card.previousElementSibling.querySelector('[aria-label*="Remove from wishlist"]')
  let wishedFor = '';
  if(inWishList) {
    wishedFor = 'X';
    // console.log("✅ ❤️ ❤️❤️❤️❤️❤️ WISHED FOR ==== ")
  }
  
  const priceSubdivs = [...priceAvailabilityRow.querySelectorAll('span')];
  const anything2 =
    priceSubdivs
      .findLast(s => /\$\d/.test(s.innerText))
      ?.innerText
      ?.replace(/\u00A0/g, ' ')
      ?.replace(',','')
      .trim() || '';
  const priceText = anything2.match(/\$\d+/)?.[0] ?? null;
  // console.log("✅ priceText:", priceText);
  // console.log("✅ checkin:", checkIn);
  // console.log("✅ checkout:", checkOut);
  
  const title =
    card.querySelector('[data-testid="listing-card-title"]')?.innerText || '';

  const subTitleElems = [...card.querySelectorAll('[data-testid="listing-card-subtitle"]')]
  const subtitles = subTitleElems
    .map(el => el.innerText.replace(/\s+/g, ' ').trim());
  console.log('subtitles', subTitleElems)
  console.log('rating row',  card.querySelector('[data-testid="listing-card-title"]').nextSibling.nextSibling.nextSibling)
   // document.querySelectorAll('[data-testid="listing-card-title"]').forEach(title => {
//   console.log(title);
// console.log(typeof title);
// console.log(title instanceof Element);
//   const thing = card.querySelector('[data-testid="listing-card-title"]').closest('div[class]');


//     console.log('thing', thing);
// console.log(typeof thing);
// console.log(thing instanceof Element);
const thing =  card.querySelector('[data-testid="listing-card-title"]').nextSibling.nextSibling.nextSibling
  const ratingText = [...thing.querySelectorAll('span')]
    .find(s => /out of 5 average rating/.test(s.textContent));

//       console.log('ratingText',ratingText);
// console.log(typeof ratingText);
// console.log(ratingText instanceof Element);

  let rating = 0
  let reviewCount = 0
if (!ratingText) {}
else{
  const [, ratingChars, reviews] = ratingText.textContent.match(
    /([\d.]+).*?(\d+)\s+reviews/
  );

   rating = Number(ratingChars)
   reviewCount = Number(reviews)

  console.log({
    title: title,
    rating: rating,
    reviews: reviewCount
  });
}
// });
 
  // bedroom · beds section of card
  let roomsCount = null;
  let bedsCount = null;

  // const roomsAndBeds = [...card.querySelectorAll('[data-testid="listing-card-subtitle"]')]
  //     .find(el => /·/i.test(el.textContent))
  //     ?.textContent

  // const bedOnlyLabel = [...card.querySelectorAll('[data-testid="listing-card-subtitle"]')]
  //     .find(el => /bed/i.test(el.textContent))
  //     ?.textContent
  // if(roomsAndBeds) {
  //   const parts = roomsAndBeds.split('·')
  //   if(parts){
  //     const roomsLabel = parts[0].trim()
  //     const bedsLabel = parts[1].trim()
  //     const roomMatch = roomsLabel.match(/(\d+)\s*/i);
  //     const bedsMatch = bedsLabel.match(/(\d+)\s*/i);
  //     roomsCount = roomMatch ? Number(roomMatch[1]) : 0.5;
  //     bedsCount = bedsMatch ? Number(bedsMatch[1]) : null;
  //   }
  // }
  // else if(bedOnlyLabel){
  //   const bedsMatch = bedOnlyLabel.match(/(\d+)\s*/i);
  //   bedsCount = bedsMatch ? Number(bedsMatch[1]) : null;
  // }

  //const roomBedsLabel = thing?.textContent//[...card.querySelectorAll('[data-testid="listing-card-subtitle"]')][2]?.textContent
  // const roomsMatch = roomBedsLabel.match(/(\d+(?:\.\d+)?).*?bedrooms?/i);
  // const bedsMatch = roomBedsLabel.match(/(\d+(?:\.\d+)?).*?beds?\b/i);
  // roomsCount = roomsMatch ? Number(roomsMatch[1]) : 0.5;
  // bedsCount = bedsMatch ?  Number(bedsMatch[1]) : null;
  // console.log('rooms bed label: ', roomBedsLabel)
  // console.log("✅ rooms count: ", roomsCount)
  // console.log("✅ beds count: ", bedsCount)
  // console.log({
  //   roomsCount: roomsCount,
  //   bedsCount: bedsCount,
  // });

//    roomsCount = +(roomBedsLabel.match(/(\d+)\s+bedroom\b/i)?.[1] ?? 0);
//     bedsCount     = +(roomBedsLabel.match(/(\d+)\s+beds?\b/i)?.[1] ?? 0);
//     const baths    = +(roomBedsLabel.match(/(\d+)\s+baths?\b/i)?.[1] ?? 0);



    const roomBedsLabel = thing?.textContent ?? "";

    // const bedrooms =
    //     roomBedsLabel.match(/(\d+(?:\.\d+)?)\s+bedrooms?/i);

    // const beds =
    //     roomBedsLabel.match(/(\d+(?:\.\d+)?)\s+beds?/i);

    // const baths =
    //     roomBedsLabel.match(/(\d+(?:\.\d+)?)\s+(?:shared\s+)?baths?/i);

    // roomsCount = bedrooms ? Number(bedrooms[1]) : 0;
    // bedsCount  = beds ? Number(beds[1]) : 0;
    // bathCount  = baths ? Number(baths[1]) : 0;

    const text = roomBedsLabel
        .replace(/\s+/g, " ")
        .trim();

    const num = "(\\d+(?:\\.\\d+)?)";

    roomsCount = Number(text.match(new RegExp(`${num}\\s*bedrooms?`, "i"))?.[1] ?? 0);
    bedsCount  = Number(text.match(new RegExp(`${num}\\s*beds?`, "i"))?.[1] ?? 0);
    bathCount  = Number(text.match(new RegExp(`${num}\\s*baths?`, "i"))?.[1] ?? 0);    

    if (!roomsCount || !bedsCount || !bathCount) {
        console.log("FAILED PARSE:");
        console.log(roomBedsLabel);
    }

    console.log({ roomsCount, bedsCount, bathCount });
  
  const description =
    subtitles.find(t => !/bed/i.test(t) && !/Saved for/i.test(t)) || '';
  // console.log("✅ description: ", subtitles[1])

  // --- Nights
  let regex = /for\s+\d+\s+night(s)?/i;
  let nights = '';
  
  const nightsLabel = [...card.querySelectorAll("span")]
      .find(el => /for\s+\d+\s+night(s)?/i.test(el.textContent))
      ?.textContent

  if(nightsLabel){
    nights = nightsLabel.match(/(\d+)\s+nights?/)?.[1] || '';   
  }
  else{
    regex = /monthly/i;
    const monthLabel = [...card.querySelectorAll("span")]
      .find(el => regex.test(el.textContent))
      ?.textContent
    if(monthLabel){
      nights = 30
    }
  }

  // console.log("✅ nights: ", nights)

  const nightsNum = Number(nights)
  const price = Number(priceText.replace("$", ""));
  const perNight = price/nights

  const listingDetails = await promise_listing;
  console.log('DEBUG listing_Details', rating, listingDetails)
  return {
    id,
    url,
    // ...areaInfo,
    title,
    description: subtitles[1],
    details: subtitles[2],
    checkIn,
    checkOut,
    price: priceText,
    priceNum: price,
    perNight,
    nights,
    rating,
    reviewCount,
    roomsCount,
    bedsCount,
    wishedFor,
    ...listingDetails
  };

};

async function resolveAreaDetails(lat, long){
  // COMMENTED OUT: TO SHORTEN EXECUTION TIME
  let city = null
  let section = null
  let sector = null
  let neighborhood=null
  let street=null
  let address=null
  let building=null
  const geocodeResult = await reverseGeocode(Number(lat), Number(long));
  let area = ''
  console.log('Area: ', area)
  if(geocodeResult){
    area = geocodeResult.full
    barrio = geocodeResult.barrio;
    neighborhood = barrio;
    city = geocodeResult.city;
    if(area){
      
      const parts = area.split(',')

      for(let i=0; i<parts.length; i++){
        const thisPart = parts[i].toLowerCase().trim()
        if(thisPart.startsWith('calle') || thisPart.startsWith('carrera') || thisPart.startsWith('avenida')){
          street = parts[i]
          if(i>=1){
            address = parts[i-1]
            
          }
          if(i>=2){
            building = parts[i-2]
          }
          if(i<parts.length-1){
            neighborhood = parts[i+1]
            console.log('Details: street:', street)
            console.log('Details: neighborhood:', neighborhood)
  
            if(i<parts.length-2){
              info = parts[i+2].trim()
              //if(info.includes('-')) {
              console.log('DEBUG DETAILS',
                         geocodeResult.city_district ,
                          geocodeResult.suburb , geocodeResult.neighborhood)
              if(info!==city)
                if(info == barrio ){
                  sector = info;
                  console.log('1: Details: sector:', sector)
                }
                else{
                  if(geocodeResult.city_district && geocodeResult.suburb && geocodeResult.neighborhood){
                    sector = geocodeResult.suburb;
                    section = geocodeResult.city_district
                    console.log('2: Details: section:', section)
                    console.log('2: Details: sector:', sector)
                  }
                  else{
                    section = info;
                    console.log('3: Details: section:', section)
                  }
                }
              }
              
            }
            break;
          }
        }
      }
  }
  // polite delay
  await sleep(300);

  return {
    area,
    city,
    section,
    sector,
    neighborhood,
    street,
    address,
    building
  }
}

async function setAreaDetails(row){
  console.log("setArea: ", row)
  const areaInfo = await resolveAreaDetails(row.lat, row.long)
  // return {
  //   ...row,
  //   ...areaInfo
  // }
  row.area = areaInfo.area
  row.city = areaInfo.city
  row.section = areaInfo.section
  row.sector = areaInfo.sector
  row.neighborhood = areaInfo.neighborhood
  row.street = areaInfo.street
  row.address = areaInfo.address
  row.building = areaInfo.building
  console.log("COMPLETED setArea: ", row)
  return row
}

async function syncParse(cards, rows){
  let processed = 0;
  for (const card of cards) {
      const listing = await parseCard(card)
      processed++;
      rows.push(listing);
  }
  return processed;
}

async function asyncParse(cards,rows){
  let processed = 0;
  const results = await Promise.all(
    [...cards].map(
      async (card) => {
        
        const listing = await parseCard(card)
        const text = card.innerText;

        const ratingMatch = text.match(/([\d.]+)\s+out of 5 average rating/i);
        const reviewMatch = text.match(/([\d,]+)\s+reviews?/i);

        const rating = ratingMatch 
            ? Number(ratingMatch[1])
            : 0;

        const reviewCount = reviewMatch
            ? Number(reviewMatch[1].replace(",", ""))
            : 0;
                processed++
                listing.rating = rating;
                listing.reviewCount = reviewCount;

                if (!listing.roomsCount || !listing.bathCount || !listing.lat || !listing.long) {
                    console.log('CARD: ',card.innerText);
                    console.log("BAD DETAILS:");
                    console.log(JSON.stringify(listing, null, 2));
                    listing.debug = card.innerText
                }
                return listing;
            }
            )  
        );
        
  // console.log("NEW ROWS: ", results);
  rows.push(...results);
  return processed;
}

function getCards(){
  const cards = [...document.querySelectorAll('[data-testid="listing-card-title"]')]
      .map(el => el.closest('div.g1qv1ctd'))
      .filter(Boolean);
  return cards;
}

function decorate(page, label, count)
{
  console.log(`/* (Page: ${page})---------------- ${label} Count ${count}---------------- */`)
}

async function process(cards, rows,  pageCount, totalCount){
  decorate(pageCount,'Card', cards.length)
  totalCount  += await asyncParse(cards, rows)
  decorate(pageCount,'TOTAL', totalCount)
  return totalCount;
}

function shouldDebug(){
  return false;
}

function debug(pageCount, maxPageCount){
  if(shouldDebug()){
    return pageCount < maxPageCount;
  }
  return true;
}

async function get(rows){
  // CONTROLS: EXECUTION LOOP I-TERATIONS
  let done = false; // pagination control
  const maxPageCount = 1; // debug stop
  const maxCardCount = 1; // debug stop
  const maxCount = 1; // debug stop
  let pageCount = 0; // current page tracking for debug stop
  let totalCount = 0;
  
  /* ---------------- BEGIN EXTRACT ---------------- */
  while(!done && debug(pageCount, maxPageCount)){
    await autoScroll();
    pageCount += 1;
    const cards = getCards();
    totalCount = await process(cards, rows, pageCount, totalCount)
    if(!clickNext()){
      done = true
    }
  }
  console.log('EXTRACT DONE!!!!!!!!'/*, rows*/)
  //---------------------END EXTRACT---------------------------------------
  return totalCount;
}

async function extract(){
  const rows = []
  await get(rows)
  //console.log('BEFORE Mapping -> FIRST 3 ROWS: ', rows.slice(0, 3));
//   console.log("EXTRACTOR ROW COUNT:", rows.length);
//    console.log("FIRST ROW:", JSON.stringify(rows[0], null, 2));

  const results = rows.map(row => ({
        id: row.id,
        url: row.url,
        title: row.title,
        description: row.description,
        priceText: row.price,
        price: row.priceNum,
        perNight: row.perNight,
        nights: row.nights, 
        rating: row.rating,
        reviews: row.reviewCount,

        bedrooms: row.roomsCount,
        beds: row.bedsCount,
        bathrooms: row.bathCount,
        guests: row.guestCount,
        roomType: row.roomType,

        latitude: row.lat,
        longitude: row.long,

        checkIn: row.checkIn,
        checkOut: row.checkOut,
        
        accuracyRating: row.accuracyRating,
        cleanlinessRating: row.cleanlinessRating,
        communicationRating: row.communicationRating,
        locationRating: row.locationRating,
        valueRating: row.valueRating,
        guestRating: row.guestRating,
        debug: row.debug


    }));
// console.log("EXTRACTOR ROW COUNT:", rows.length);
  //  console.log("\nFIRST ROW:", JSON.stringify(results[0], null, 2));

  //console.log('AFTER Mapping -> FIRST 3 ROWS: ', results.slice(0, 3));
  return results;
}

function normalizeValue(value, min, max) {
  return (value - min) / (max - min);
}

function normalize(listing, mins, maxes, categoryDimensions) {
  const normalized = {}
  for(const categoryDimension of categoryDimensions){
    normalized[categoryDimension] = 
      normalizeValue(
        listing[categoryDimension],
        mins[categoryDimension],
        maxes[categoryDimension]
      )
  
  }
  return normalized
}

function computeWeightedScore(listing, weights, mins, maxes) {
    const {
      //price,
      rating,
      perNight,
      roomsCount,
      bathCount,
      //amenitiesCount,
      reviewCount,
      
    } = normalize(listing, mins, maxes,
                 [
                   "rating",
                   "perNight",
                   "roomsCount",
                   "bathCount",
                   "reviewCount"
                   //"amenitiesCount"
                 ]);
  //   const weights = {
  //   rating: 0.30,
  //   priceNum: 0.25,
  //   perNight: 0.25,
  //   roomsCount: 0.15,
  //   bathCouunt: 0.15,
  //   amenitiesCount: 0.15,
  //   reviewCount: 0.10
  // };
    const weightedScore = (
      //weights.price * (1 - price) +             // cheaper = better
      weights.perNight * (1-perNight) +
      weights.rating * rating + 
      //weights.reviewCount * reviewCount +
      weights.roomsCount * roomsCount +
      weights.bathCount * bathCount /*+
      weights.amenities * amenitiesCount          // higher rating = better
      weights.reviews * reviewCount +           // more reviews = more trust
      weights.distance * (1 - distance) +         // closer = better
      weights.amenities * amenitiesScore          // better match = better
      */
    );
  
    // console.log('normalListing + weightedScore: ', 
    // //  listing, 
    //   weightedScore, 
    //              weights.perNight * (1-perNight) ,
    //             weights.rating * rating , 
    //             weights.reviewCount * reviewCount ,
    //             weights.roomsCount * roomsCount ,
    //               weights.bathCount * bathCount,
                
    //             bathCount,
    //             weights.bathCount

    //            );
    listing.weightedScore = weightedScore
    return weightedScore;
}

function computeUpdateMaxValue(maxMap, categoryDimension, value){
  const currentMax = maxMap[categoryDimension];
  if(value > currentMax){
    maxMap[categoryDimension] = value;
  }
}
function computeUpdateMinValue(minMap, categoryDimension, value){
  const currentMin = minMap[categoryDimension];
  if(value < currentMin){
    minMap[categoryDimension] = value;
  }
}
function computeUpdateMax(listing, maxMap, minMap, categoryDimension){
  computeUpdateMaxValue(maxMap, categoryDimension, listing[categoryDimension]);
  computeUpdateMinValue(minMap, categoryDimension, listing[categoryDimension]);
}
function computeUpdateMaxList(listing, maxMap, minMap, categoryDimensions){
  // console.log('DEBUG max listing: ', listing)
  for(const categoryDimension of categoryDimensions){
    // console.log('DEBUG max BEFORE: ', categoryDimension, listing[categoryDimension], maxMap)
    computeUpdateMax(listing, maxMap, minMap, categoryDimension);
    // console.log('DEBUG max AFTER: ', categoryDimension, listing[categoryDimension], maxMap)
  }
}
function computeUpdateSumList(listing, sums, categoryDimensions){
    // console.log('DEBUG sum listing: ', listing)
  for(const categoryDimension of categoryDimensions){
    // console.log('DEBUG sum BEFORE: ', categoryDimension, listing[categoryDimension], sums[categoryDimension])
    sums[categoryDimension] += listing[categoryDimension];
    // console.log('DEBUG sum AFTER: ', categoryDimension, listing[categoryDimension], sums[categoryDimension])
  }
}

function computeMaxesAndSums(rows){
  const mins = {
     rating: 0,
     priceNum: 0,
     perNight: 0,
     reviewCount: 0,
     roomsCount: 0,
     bathCount: 0,
     bedsCount: 0,
     guestCount: 0,
     amenityCount: 0,
     // dependent on above
     brandPriceValue: 0,
     bargainValue: 0,
     quick: 0,
     reputation: 0,
     totalScore: 0,
     avgScore: 0,
     ratingBargainScore: 0
  }
  const maxes = {
     rating: 0,
     priceNum: 0,
     perNight: 0,
     reviewCount: 0,
     roomsCount: 0,
     bathCount: 0,
     bedsCount: 0,
     guestCount: 0,
     amenityCount: 0,
     // dependent on above
     brandPriceValue: 0,
     bargainValue: 0,
     quick: 0,
     reputation: 0,
     totalScore: 0,
     avgScore: 0,
     ratingBargainScore: 0
  }
  const sums = {
     rating: 0,
     priceNum: 0,
     perNight: 0,
     reviewCount: 0,
     roomsCount: 0,
     bathCount: 0,
     bedsCount: 0,
     guestCount: 0,
     amenityCount: 0,
     // dependent on above
     brandPriceValue: 0,
     bargainValue: 0,
     quick: 0,
     reputation: 0,
     totalScore: 0,
     avgScore: 0,
     ratingBargainScore: 0
  }

  /* ---------------- BEGIN PROCESSING ---------------- */
  let rowCount=1;
  for (const listing of rows) {
    listing.cardId = rowCount;
    rowCount++;
    let {
      rating,
      priceNum,
      perNight,
      reviewCount,
      roomsCount,
      bathCount,
      bedsCount,
      guestCount,
      amenitiesCount
    } = listing;
    
    
    // sums.rating += rating;
    // sums.perNight += perNight;

    computeUpdateSumList(
      listing, 
      sums, 
      [
         "rating",
         "priceNum",
         "perNight",
         "reviewCount",
         "roomsCount",
         "bathCount",
         "bedsCount",
         "guestCount",
         "amenitiesCount"
      ]
    )
    
    computeUpdateMaxList(
      listing, 
      maxes, 
      mins,
      [
         "rating",
         "priceNum",
         "perNight",
         "reviewCount",
         "roomsCount",
         "bathCount",
         "bedsCount",
         "guestCount",
         "amenitiesCount"
      ]
    )
  }
  return {mins, maxes, sums}
}
async function computeSpecialValues(rows, mins, maxes, sums){
  console.log('DEBUG maxes: ', maxes)
  console.log('DEBUG sums: ', sums)
  
  return await Promise.all(rows.map(
    async (item,i,arr) => {
    const rating = Number(item.rating)
    const reviewCount = Number(item.reviewCount)
    const roomsCount = Number(item.roomsCount)
    const bathCount = Number(item.bathCount)
    const bedsCount = Number(item.bedsCount)   
    const perNight = Number(item.perNight)
    const quick = rating / perNight;

    // use MAX COUNTs here
    const reputation = 
          rating * Math.log10(reviewCount) //+ 
            // (reviewCount / maxes.reviewCount)
    const brandValue = 
          reputation + //rating + 
             (
              // (reviewCount/maxes.reviewCount) + 
               (bedsCount/maxes.bedsCount/10) +
               (roomsCount/maxes.roomsCount/10) /*+
               (bathCount/maxes.bathCount/10)*/
             )
    const brandPriceValue = 
          brandValue / perNight

    const bargainValue = bedsCount/perNight

    // NEW calculated values
    // console.log('✅ Quick: ', quick, rating, perNight)
    // console.log('✅ Reputation: ', reputation, rating, reviewCount)//, maxReviewCount)
    // console.log('✅ Brand Value: ', brandValue)//, rating, reviewCount, maxReviewCount, bedsCount, maxBedCount, (reviewCount/maxReviewCount),(bedsCount/maxBedCount/10),(roomsCount/maxRoomCount/10),(bathCount/maxBathCount/10), roomsCount, bathCount, maxRoomCount, maxBathCount)
    // console.log('✅ Brand Price Value: ', brandPriceValue)
    // console.log('✅ Bargain Value: ', bargainValue, bedsCount)//, item)
    
    // update FORMULA: sums
    // sums.brandPriceValue += brandPriceValue;
    // sums.bargainValue += bargainValue;
    // sums.reputation += reputation
    //const areaInfo = await resolveAreaDetails(item.lat, item.long)
    const updated = {
      ...item,
      //...areaInfo,
      brandPriceValue,
      bargainValue,
      quick,
      reputation
    };
    arr[i] = updated;

    computeUpdateSumList(
      updated, 
      sums, 
      [
         "brandPriceValue",
         "bargainValue",
         "quick",
         "reputation"
      ]
    )
    
    computeUpdateMaxList(
      updated, 
      maxes, 
      mins,
      [
         "brandPriceValue",
         "bargainValue",
         "quick",
         "reputation"
      ]
    )
    return updated;
  }));
}
function computeAverages(rows, sums, totalCount){
  console.log('DEBUG sums: ', sums)
  console.log('DEBUG totalCount: ', totalCount)
  // CALCULATE: averages
  const averages = {
    rating: sums.rating/totalCount,
    priceNum: sums.priceNum/totalCount,
    perNight: sums.perNight/totalCount,
    brandPriceValue: sums.brandPriceValue/totalCount,
    bargainValue: sums.bargainValue/totalCount,
    reputation: sums.reputation/totalCount
  }

  // console.log("✅ Price Average: ", priceAvg)
  // console.log("✅ PerNight Average: ", perNightAvg)
  // console.log("✅ Brand Value Average: ", brandPriceValueAvg, sums.brandPriceValue)
  // console.log("✅ Bargain Value Average: ", bargainAvg)
  // console.log('✅ Reputation Average: ', reputationAvg)
  return averages;
}
function computeDeviatedSquaredSums(rows,averages){
  // console.log('DEBUG averages: ', averages)
  // CALCULATE: summation((x-avg)^2) for i..n
  let ratingDevSquaredSum = 0;
  let perNightDevSquaredSum = 0;
  let priceDevSquaredSum = 0;
  let brandPriceValueDevSquaredSum = 0;
  let bargainDevSquaredSum = 0;
  let reputationDevSquaredSum = 0;

  //let sleepFor = 1000
  for (const row of rows) {
  // for(let i=0; i<rows.length; i++){
    // const row = rows[i];
    // const row = await setAreaDetails(rows[i])
    // sleep(3000)
    // console.log('sleepFor: ', sleepFor)
    // sleep(sleepFor)
    // sleepFor+=1000
    //await setAreaDetails(row)
    const id = row.id
    const rating = Number(row.rating);
    const guestRating = Number(row.guestRating)
    // console.log('DEBUG PRICE: ',row.price, row)
    const priceNum = Number(row.priceNum)//.replace("$", ""));
    const perNight = Number(row.perNight)
    const brandPriceValue = Number(row.brandPriceValue)
    const bargainValue = Number(row.bargainValue)
    const reputation = Number(row.reputation)

    // use averages here
    const ratingDeviation = Math.abs(rating - averages.rating)
    const ratingDevSquared = Math.pow(ratingDeviation, 2)
    ratingDevSquaredSum = ratingDevSquaredSum + ratingDevSquared
    
    const perNightDeviation = Math.abs(perNight - averages.perNight)
    const perNightDevSquared = Math.pow(perNightDeviation, 2)
    perNightDevSquaredSum = perNightDevSquaredSum + perNightDevSquared
    
    const priceDeviation = Math.abs(priceNum - averages.priceNum)
    const priceDevSquared = Math.pow(priceDeviation, 2)
    priceDevSquaredSum = priceDevSquaredSum + priceDevSquared

    const brandPriceValueDeviation = Math.abs(brandPriceValue - averages.brandPriceValue)
    const brandPriceValueDevSquared = Math.pow(brandPriceValueDeviation, 2)
    brandPriceValueDevSquaredSum = brandPriceValueDevSquaredSum + brandPriceValueDevSquared

    const bargainDeviation = Math.abs(bargainValue - averages.bargainValue)
    const bargainDevSquared = Math.pow(bargainDeviation, 2)
    bargainDevSquaredSum = bargainDevSquaredSum + bargainDevSquared

    const reputationDeviation = Math.abs(reputation - averages.reputation)
    const reputationDevSquared = Math.pow(reputationDeviation, 2)
    reputationDevSquaredSum = reputationDevSquaredSum + reputationDevSquared
  }
  return {
    rating: ratingDevSquaredSum,
    perNight: perNightDevSquaredSum,
    priceNum: priceDevSquaredSum,
    brandPriceValue: brandPriceValueDevSquaredSum,
    bargainValue: bargainDevSquaredSum,
    reputation: reputationDevSquaredSum
  }
}
function computeStandardDeviations(rows,devSquaredSum,totalCount){
  // Calculate: standard deviation
  const stdDev = {
    rating: Math.sqrt(devSquaredSum.rating/totalCount),
    priceNum: Math.sqrt(devSquaredSum.priceNum/totalCount),
    perNight: Math.sqrt(devSquaredSum.perNight/totalCount),
    brandPriceValue: Math.sqrt(devSquaredSum.brandPriceValue/totalCount),
    bargainValue: Math.sqrt(devSquaredSum.bargainValue/totalCount),
    reputation: Math.sqrt(devSquaredSum.reputation/totalCount)
  }
  // console.log('DEBUG stdDev: ', stdDev)
  // console.log('DEBUG devSquaredSum: ', devSquaredSum)
  // console.log("✅ Rating Standard deviation: ", ratingStd, " Average: ", ratingAvg)
  // console.log("✅ Price Standard deviation: ", priceStd, " Average: ", priceAvg)
  // console.log("✅ PerNight Standard deviation: ", perNightStd, " Average: ", perNightAvg)
  // console.log("✅ Value Standard deviation: ", brandPriceValueStd, " Average: ", brandPriceValueAvg)
  // console.log("✅ Bargain Standard deviation: ", bargainStd, " Average: ", bargainAvg)
  // console.log("✅ Reputation Standard deviation: ", reputationStd, " Average: ", reputationAvg)
  return stdDev;
}
function computeZscores(rows, sums, averages, std, specialValues){
  console.log('DEBUG averages: ', averages)
  console.log('DEBUG std: ', std)
  console.log('DEBUG specialValues: ', specialValues)
  // Calculate: z-scores or # of deviations away from mean
  rows = rows.map(
    item => {
        const rating = Number(item.rating);
        const priceNum = Number(item.priceNum);//.replace("$", ""));
        const perNight = Number(item.perNight)
        const brandPriceValue = Number(item.brandPriceValue)
        const bargainValue = Number(item.bargainValue)
        const reputation = Number(item.reputation)

        // console.log('DEBUG item: ', item, 
        //             rating, 
        //             priceNum, 
        //             perNight, 
        //             brandPriceValue, 
        //             bargainValue, 
        //             reputation)

        // use averages and standard deviations here
        const ratingZscore = (averages.rating - rating)/std.rating
        const ratingScore = 100-100*zToPercentile(ratingZscore)
        const priceZscore = (averages.priceNum - priceNum)/std.priceNum
        const priceScore = 100*zToPercentile(priceZscore)
        const perNightZscore = (averages.perNight - perNight)/std.perNight
        const perNightScore = 100*zToPercentile(perNightZscore)
        const brandPriceValueZscore = (averages.brandPriceValue - brandPriceValue)/std.brandPriceValue
        const brandPriceValueScore = 100-100*zToPercentile(brandPriceValueZscore)
        const bargainZscore = (averages.bargainValue - bargainValue)/std.bargainValue
        const bargainScore = 100-100*zToPercentile(bargainZscore)
        const reputationZscore = (averages.reputation - reputation)/std.reputation
        const reputationScore = 100-100*zToPercentile(reputationZscore)
        // console.log('Zscore: ', priceZscore, perNightZscore, brandPriceValueZscore, bargainZscore, reputationZscore)
        // console.log('Score: ', priceScore, perNightScore, brandPriceValueScore, bargainScore, reputationScore)
        // console.log('priceZscore: ', priceZscore, averages.priceNum, priceNum, std.priceNum)
        // console.log('bargainZscore: ', bargainZscore, averages.bargainValue, bargainValue, std.bargainValue)
        // use z-scores -> percentile -> score
        // avgDev = 
        //   (
        //     //perNightZscore + 
        //     (-1*brandPriceValueZscore) + 
        //     bargainZscore
        //   )
        //   /
        //   2
        // const score = 100*zToPercentile(avgDev) // ≈ 0.8413 → 84.13%
        const totalScore = 
          ratingScore + 
          priceScore + 
          perNightScore + 
         // brandPriceValueScore + 
          bargainScore// + 
         //reputationScore
        item.ratingBargainScore = ratingScore + bargainScore
        item.ratingBargainScoreAverage = (ratingScore + bargainScore)/2
        item.totalScore = totalScore
        // console.log('✅ Total Score: ', 
        //             totalScore,
        //             ratingScore,
        //   priceScore ,
        //   perNightScore,
        //   brandPriceValueScore,
        //   bargainScore,
        //   reputationScore)
        const avgScore = totalScore/4//6
        item.avgScore = avgScore
        console.log('✅ Average Score: ', avgScore)
        sums.totalScore += totalScore;
        sums.avgScore += avgScore;
        // ratingBargainScoreSum = ratingBargainScoreSum + item.ratingBargainScore;
        // ratingBargainAvgScoreSum = ratingBargainAvgScoreSum + item.ratingBargainAvgScore;
      
      
        return {
          ...item,
          ratingZscore,
          ratingScore,
          priceZscore,
          priceScore,
          perNightZscore,
          perNightScore,
          brandPriceValueZscore,
          brandPriceValueScore,
          bargainZscore,
          bargainScore,
          reputationZscore,
          reputationScore,
          totalScore,
          avgScore/*,
          ratingBargainScore,
          ratingBargainAvgScore*/
        };
  });
}
function computeNormalScores(rows, sums, totalCount){
  // console.log('DEBUG sums: ', sums)
  // console.log('DEBUG totalCount: ', totalCount)
  // Calculate: average score
  let totalScoreDevSquaredSum = 0
  const totalScoreAvg = sums.totalScore/totalCount;
  console.log("✅ Total Score Average: ", totalScoreAvg, sums.totalScore, totalCount)

  let avgScoreDevSquaredSum = 0
  const avgScoreAvg = sums.avgScore/totalCount;
  console.log("✅ Average Score Average: ", avgScoreAvg, sums.avgScore, totalCount)

  // Calculate: summation((x-avg)^2) for i..n for scores
  for (const row of rows) {
    const totalScore = Number(row.totalScore)
    const totalScoreDeviation = Math.abs(totalScore - totalScoreAvg)
    const totalScoreDevSquared = Math.pow(totalScoreDeviation, 2)
    totalScoreDevSquaredSum = totalScoreDevSquaredSum + totalScoreDevSquared

    const avgScore = Number(row.avgScore)
    const avgScoreDeviation = Math.abs(avgScore - avgScoreAvg)
    const avgScoreDevSquared = Math.pow(avgScoreDeviation, 2)
    avgScoreDevSquaredSum = avgScoreDevSquaredSum + avgScoreDevSquared
  }

  // Calculate: score standard deviatio
  const totalScoreStd = Math.sqrt(totalScoreDevSquaredSum/totalCount)
  const avgScoreStd = Math.sqrt(avgScoreDevSquaredSum/totalCount)
  rows = rows.map(
    item => {
      const totalScore = Number(item.totalScore)
      // use score avg, standard deviation
      const totalScoreZscore = (totalScoreAvg - totalScore)/totalScoreStd
      item.totalScoreZscore = totalScoreZscore


      const avgScore = Number(item.avgScore)
      // use score avg, standard deviation
      const avgScoreZscore = (avgScoreAvg - avgScore)/avgScoreStd
      item.avgScoreZscore = avgScoreZscore
      return {
          ...item,
          avgScoreZscore
      };
  });
}
function computeWeightedScores(rows,weights,mins,maxes){
  rows = rows.map(
    (item,i,arr) => {
      const weightedScore = computeWeightedScore(item,weights,mins,maxes);
      item.weightedScore = weightedScore
      arr[i].weightedScore = weightedScore
      return item
  });
  return rows;
}
function computeSurprises(rows,averages){
  const bounding_boxes ={
    "Cartagena": [10.30,10.50,-75.60,-75.40],
    "Barranquilla": [10.90,11.05,-74.90,-74.70],
    "Valledupar": [10.35,10.55,-73.40,-73],
    "Santa Marta": [11.10,11.30,-74.30,-74.10],
    "Bogota": [4.50,4.80,-74.20,-73.95],
    "Cali": [3.30,3.55,-76.65,-76.45],
    "Ibague": [4.35,4.55,-75.30,-75.10],
    "Medellin": [6.15,6.35,-75.65,-75.50],
    "Pereira": [4.70,4.90,-75.80,-75.60],
    "Armenia": [4.45,4.65,-75.80,-75.60],
    "Bucaramanga": [7.05,7.20,-73.20,-73],
    'Manizales': [5.00,5.15,-75.60,-75.40]
  } 

  function isOutside(lat, long){
    for(const [key, value] of Object.entries(bounding_boxes)){
      if(lat>=value[0] && lat<=value[1] && long>=value[2] && long<=value[3])
        return false;
    }
    return true;
  }

  // console.log('averages: ', averages)
  
  rows = rows.map(
    (item,i,arr) => {
     const reputation = Number(item.reputation)
     const bargainValue = Number(item.bargainValue)
     const lat = Number(item.lat)
     const long = Number(item.long)
     const price = Number(item.priceNum)//.replace("$", ""));
     const perNight = Number(item.perNight)

     const isBarranquilla = lat>=10.90 && lat<=11.05 && long>=-74.90 && long<=-74.70
     const isCartagena = lat>=10.30 && lat<=10.50 && long>=-75.60 && long<=-75.40
     const isMarta = lat>=11.10 && lat<=11.30 && long>=-74.30 && long<=-74.10
     const isValledupar = lat>=10.35 && lat<=10.55 && long>=-73.40 && long<=-73.10
     const outside = isOutside(lat,long)// !isBarranquilla && !isCartagena && !isMarta && !isValledupar
     const bargainBetterThanAvg = bargainValue > averages.bargainValue
     const reputationBetterThanAvg = reputation > averages.reputation
     const perNightLowerThanAvg = perNight < averages.perNight
     const perNightBetterThanAvg = perNightLowerThanAvg && (averages.perNight - perNight)/averages.perNight > 0.10
     const priceLowerThanAvg = price < averages.priceNum

     let surprise = ''
     if(outside && bargainBetterThanAvg && reputationBetterThanAvg)
     {
       surprise = '5'
     }
     else if(outside && perNightBetterThanAvg && reputationBetterThanAvg)
     {
       surprise = '4'
     }
     else if(outside && perNightLowerThanAvg && reputationBetterThanAvg)
     {
       surprise = '3'
     }
     else if(perNightBetterThanAvg && reputationBetterThanAvg)
     {
       surprise = '2'
     }
     else if(perNightLowerThanAvg && reputationBetterThanAvg)
     {
       surprise = '1'
     }
     // console.log('surprise: ', 
     //             surprise, 
     //                bargainBetterThanAvg,
     //  reputationBetterThanAvg,
     //  perNightLowerThanAvg,
     //  perNightBetterThanAvg,
     //  priceLowerThanAvg,
     //               outside)
     // const update = {
     //  ...item,
     //  surprise
     // };
     // arr[i] = update;
     //  return update;
      item.surprise = surprise
      return {
        ...item,
        surprise
      };
     
  });
}
function sort(rows, lambda){
  rows.sort(lambda);
}
function sorting(rows){
  rows.sort((a, b) => {
    return a.brandPriceValue - b.brandPriceValue ||
           b.bargainValue - a.bargainValue;
  });
}
function computeWatermarks(rows,maxes){
  const marks = []
  let perNight = 6.55
  while(perNight <= maxes.perNight){
    const newMark = formula(perNight,5,6,2,2);
    marks.push(newMark)
    perNight += 10
  }
  // console.log("✅ marks: ", marks)


  const watermarks = []
  let watermarkCount = 0;
  for(const mark of marks){
    
    const ceiling = Math.ceil(mark * 1000 + 1) / 1000
    const floor = Math.floor(mark*1000 - 1)/1000
    // const filtered = rows.filter(x => Math.floor(x.brandPriceValue*1000)/1000>=mark && Math.floor(x.brandPriceValue*1000)/1000<=ceiling)
    const filtered = rows.filter(
      x => x.brandPriceValue >= floor && x.brandPriceValue<=ceiling)

    // console.log(watermarkCount, ' current mark: ', mark, floor, ceiling, filtered )

    let max_diff = 1000
    if(filtered.length>1){
      for(const x of filtered){
        const diff = Math.abs(x.brandPriceValue - mark)
        if(diff <= max_diff){
          max_diff = diff
          x.mark = diff;
          // console.log('max_diff: ', max_diff )
        }
      }
    }

    
    //for(let i=filtered.lenght-1; i>=0; i--){
    for(let i=0; i<filtered.length; i++){
      const current = filtered[i];
      const bpv = current.brandPriceValue;
      // if(bpv === mark){
      const diff = Math.abs(bpv - mark)
      if(diff <= max_diff){
        current.watermark = "watermark" + watermarkCount
        current.mark = mark
        current.markIndex = watermarkCount
        watermarks.push(current)
      }
      // }
      // else{
       // if(watermarks.length===0 || watermarks[0].brandPriceValue === bpv){
          // current.watermark = "watermark" + watermarkCount
          // watermarks.push(current)
        // }
        // else{
        //   break;
        // }
      // }
    }
    watermarkCount += 1;
  }

  // console.log("✅ watermarks: ", watermarks, rows)

  return watermarks;
}
function computeUpandDownGrades(rows,watermarks){
  //TODO: Empty
    // for(const watermark of watermarks){
  //   const bottomBPV = formula(6.55+(watermark.markIndex*10)+5,5,6,2,2);
  //   const topBPV = formula(6.55+(watermark.markIndex*10)-5,5,6,2,2);
  //   // const maxPerNight = watermark.perNight + 5;
  //   // const minPerNight = watermark.perNight - 5;
  //   // const upperFiltered = rows.filter(
  //   //   x => x.perNight<=maxPerNight && x.perNight>=watermark.perNight
  //   // )
  //   // const lowerFiltered = rows.filter(
  //   //   x => x.perNight<watermark.perNight && x.perNight>=minPerNight
  //   // )
  //   //console.log('water mark: ', watermark.watermark, maxPerNight, minPerNight, watermark, upperFiltered, lowerFiltered)


  //   const upperFiltered = rows.filter(
  //     x => x.brandPriceValue<=topBPV && x.brandPriceValue>=watermark.brandPriceValue
  //   )
  //   const lowerFiltered = rows.filter(
  //     x => x.brandPriceValue<watermark.brandPriceValue && x.brandPriceValue>=bottomBPV
  //   )

  //   console.log(watermark.markIndex, ' water mark: ', watermark.brandPriceValue, topBPV, bottomBPV, watermark, upperFiltered, lowerFiltered)

    
  //   let upgrade = watermark;
  //   let found = false;
  //   for(const u of lowerFiltered){
  //     if(u.rating > upgrade.rating || (u.rating===upgrade.rating && u.reviewCount>upgrade.reviewCount)){
  //       if(u.rating > upgrade.rating) console.log('upgrade found -> better rating: ', u.rating, upgrade.rating, u, upgrade)
  //       else if(u.reviewCount > upgrade.reviewCount) console.log('upgrade found -> better reviewCount: ', u.reviewCount, upgrade.reviewCount, u, upgrade)

  //       upgrade = u
  //       found = true;
  //     }
  //   }
  //   if(found && !upgrade.watermark){
  //     upgrade.watermark = "upgrade" + watermark.watermark.replace("watermark","")
  //     console.log('upgrade: ', upgrade.rating, watermark.rating, upgrade.reviewCount, watermark.reviewCount, upgrade)
  //   }


  //   let downgrade = watermark;
  //   found = false;
  //   for(const d of upperFiltered){
  //     if(d.roomsCount > downgrade.roomsCount){
  //       console.log('downgrade found -> better rooms count: ', d.roomsCount, downgrade.roomsCount, d, downgrade)
  //       downgrade = d
  //       found = true;
  //     }
  //   }

  //    if(found && !downgrade.watermark){
  //     downgrade.watermark = "downgrade"+ watermark.watermark.replace("watermark","")
  //     console.log('downgrade: ', downgrade.roomsCount, watermark.roomsCount, downgrade)
  //   }
  // }
}
function reorderColumns(rows){

  rows = rows.map(
    (item,i,arr) => {
      const { 
       // url,
        cardId,
        reviews,
        confidence,
        goodTotal,
        badTotal,
        new_good,
        new_bad,
        grand_total,
        totalVotes,
        comboVotes,
        firstPlaceVotes,
        secondPlaceVotes,
        weightedScore,
        roomsCount,
        mark,
        watermark,
        reviewCount,
        bathCount,
        bedsCount,
        price,
        perNight, 
        rating, 
        surprise, 
        wishedFor, 
        quick, 
        reputation, 
        brandPriceValue,
        bargainValue, 
        ...rest 
      } = item;
      
      const reordered = {
        cardId,
        ...rest,
      //  url,
        weightedScore,
        surprise,
        wishedFor,
        bedsCount,
        bathCount,
        quick,
        bargainValue,
        reputation,
        price,
        perNight,
        rating,
        reviewCount,
        brandPriceValue,
        roomsCount,
        confidence,
        goodTotal,
        badTotal,
        new_good,
        new_bad,
        grand_total,
        totalVotes,
        comboVotes,
        firstPlaceVotes,
        secondPlaceVotes,
        watermark,
        mark
      };
      
      // console.log(reordered);
      arr[i] = reordered
      return reordered;
    }
  );
}
function getReviews(item){
  // console.log('reviews:', item.reviews, item)
  return item.reviews
  //https://www.airbnb.com/rooms/1401660857331068637?adults=2&check_in=2026-05-16&check_out=2026-05-19&search_mode=regular_search&children=0&infants=0&pets=0&photo_id=2157474856&source_impression_id=p3_1778694785_P3nLmH5uGxluTolE&previous_page_section_name=1000&federated_search_id=e873d329-b054-4451-a7d0-88df54701a99
  //json
  //CategoryLabel -> Pdp in ListingDetails
}
function getWillingToPay(item,priori){
  let total = 0;
  let pay = 0;
  Object.entries(priori).forEach(([key, value]) => {
    total += value
    if(item.perNight>=key && item.perNight<=(key+9)){
      pay = value + 1
      item.payKey = key
    }
  })
  const confidence = (pay/total)//*100
  return confidence
  // const good = reviews.filter(x=>Number(x.label)>=3)
  // const bad = reviews.filter(x=>Number(x.label)<3)
  // let goodTotal = 0;
  // let badTotal = 0;
  // good.forEach( g  => {
  //   goodTotal += Number(g.percentage)*item.reviewCount
  // })
  // bad.forEach( b => {
  //   badTotal += Number(b.percentage)*item.reviewCount
  // })
  // item.goodTotal = goodTotal
  // item.badTotal = badTotal
  // const new_good =  priori.good + goodTotal
  // const new_bad =  priori.bad + badTotal
  // item.new_good = new_good
  // item.new_bad = new_bad
  // const grand_total = new_good + new_bad
  // item.grand_total = grand_total
  // const confidence = (new_good/grand_total)//*100
  // const penalty = Math.log10(item.reviewCount)
  // return {confidence, penalty}
}
function getConfidencePenalty(item,priori,reviews){
  const good = reviews.filter(x=>Number(x.label)>=3)
  const bad = reviews.filter(x=>Number(x.label)<3)
  let goodTotal = 0;
  let badTotal = 0;
  good.forEach( g  => {
    goodTotal += Number(g.percentage)*item.reviewCount
  })
  bad.forEach( b => {
    badTotal += Number(b.percentage)*item.reviewCount
  })
  item.goodTotal = goodTotal
  item.badTotal = badTotal
  const new_good =  priori.good + goodTotal
  const new_bad =  priori.bad + badTotal
  item.new_good = new_good
  item.new_bad = new_bad
  const grand_total = new_good + new_bad
  item.grand_total = grand_total
  //const confidence = (new_good/grand_total)//*100
  const confidence = priori.good/(priori.good + priori.bad)
  const penalty = Math.log10(item.reviewCount)
  return {confidence, penalty}
}
function applyFilters(filters){
  // TODO: Empty
}
function decide(rows){
  // TODO: Empty
  /* ---------------- DECIDE: 
    sort, 
    filter:love/like, 
    z-current, 
    compare 1, compare 2, better 
    train -> predict or model load -> predict
    ---------------- */
  // TODO: Empty
}
function output(rows){
  /* ---------------- CSV ---------------- */
  const filename = `airbnb_listings_${Date.now()}.csv`;
  const toCSV = (data) => {
    const headers = Object.keys(data[0]);
  
    const rows = data.map(obj =>
      headers.map(h => {
        const val = obj[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
  
    return [headers.join(','), ...rows].join('\n');
  };
  const csv2 = toCSV(rows);
  /* ---------------- download ---------------- */
  const blob1 = new Blob([csv2], { type: 'text/csv' });
  const url1 = URL.createObjectURL(blob1);
  
  const a1 = document.createElement('a');
  a1.href = url1;
  a1.download = filename;
  a1.click();

  const filename2 = `airbnb_listings_${Date.now()}.json`;

//   fs.writeFileSync(filename2, JSON.stringify(data, null, 2), 'utf-8');
    const json = JSON.stringify(rows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename2;
    a.click();
  console.log('✅ JSON written:', filename);
}
async function doStuff(){
  //-------------------Phase 0---------
  const weights = {
    rating: 0.4,
    priceNum: 0.25,
    perNight: 0.25,
    roomsCount: 0.20,
    bathCount: 0.10,
    amenitiesCount: 0.15,
    reviewCount: 0.05
  };
  //-------------------Phase 1---------
  let rows = [];
  const totalCount = await extract(rows)
  //-------------------Phase 2 -------
  const {
    mins,
    maxes,
    sums
  } = computeMaxesAndSums(rows)
  //-------------------Phase 3 -------
  const specialValues = computeSpecialValues(rows, mins, maxes, sums);
  // console.log('specialValues: ', specialValues)
  //-------------------Phase 4 -------
  const averages = computeAverages(rows, sums, totalCount);
  //-------------------Phase 5 -------
  const devSquaredSum = computeDeviatedSquaredSums(rows, averages)
  //-------------------Phase 6 -------
  const standardDeviations = computeStandardDeviations(rows,devSquaredSum,totalCount)
  //-------------------Phase 7 -------
  const zScores = computeZscores(rows,sums,averages,standardDeviations)
  //-------------------Phase 8 -------
  const normalScores = computeNormalScores(rows, sums, totalCount)
  //-------------------Phase 9 -------
  const weightedScores = computeWeightedScores(rows,weights,mins,maxes)
  // console.log('weighted scores: ', weightedScores, rows)
  //-------------------Phase 10 -------
  const surprises = computeSurprises(rows,averages)
  //-------------------Phase 11 -------
  sorting(rows)
  //-------------------Phase 12 -------
  const watermarks = computeWatermarks(rows,maxes)
  // console.log('after watermarks compute: ', rows)
  //-------------------Phase 13 ---------
  const groups = [
    rows.filter(x=>x.rating===5),
    rows.filter(x=>x.rating>=4.9 && x.rating<5),
    rows.filter(x=>x.rating>=4.8 && x.rating<4.9),
    rows.filter(x=>x.rating>=4.7 && x.rating<4.8)
  ]
  //for (let group of group) {
  for (let g = 0; g < groups.length; g++) {
  const star = 5-g/10;
  const group = groups[g]
  console.log('===================================')
  console.log(star + "* airbnbs")
  console.log('===================================')
  console.log() 
  if (group.length === 0) {console.log("No airbnbs"); continue;}
  sort(group,(a,b)=>b.avgScore-a.avgScore)
  const averageWins = [
   group[0],
   group[1]
  ]

  console.log('average wins: ', averageWins, group)
  

  sort(group,(a,b)=>b.weightedScore-a.weightedScore)
  const weightedWins = [
   group[0],
   group[1]
  ]

  const priori = {
    good: 68,
    bad: 34
  }

  // const reviews = {
  //   good: 0,
  //   bad: 0
  // }

  // const new_good =  priori.good + reviews.good
  // const new_bad =  priori.bad + reviews.bad
  // total = new_good + new_bad
  // expected = (new_good/total)*100
  // penalty = expected * Math.log10(total)
  
  const set = group.map((item,i,arr)=>{
    const reviews = getReviews(item)
    const {confidence, penalty} = getConfidencePenalty(item,priori,reviews)
    item.confidence = confidence
    item.penalty = penalty
    item.expected_value = confidence * penalty
    return item
  })

  sort(set, (a,b)=>b.confidence-a.confidence)
  console.log('sorted by confidence decreasing: ', set)
  const confidenceWins = [
    set[0],
    set[1]
  ]
  
  sort(set, (a,b)=>b.expected_value-a.expected_value)
  console.log('sorted by expected_value decreasing: ', set)

  const expectedWins = [
    set[0],
    set[1]
  ]


  const new_set = set.map((item,i,arr)=>{
    const confidence = item.confidence
    const confidentAvgScore = confidence * item.avgScore
    item.confidentAvgScore = confidentAvgScore
    return item
  })

  sort(new_set, (a,b)=>b.confidentAvgScore-a.confidentAvgScore)

  console.log('sorted by confidentAvgScore decreasing: ', new_set)

  const confidentAvgScoreWins = [
    new_set[0],
    new_set[1]
  ]
  
  const other_set = new_set.map((item,i,arr)=>{
    const confidence = item.confidence
    const confidentWeightedScore = confidence * item.weightedScore
    item.confidentWeightedScore = confidentWeightedScore
    return item
  })


  sort(other_set, (a,b)=>b.confidentWeightedScore-a.confidentWeightedScore)
  console.log('sorted by confidentWeightedScore decreasing: ', other_set)

  const confidentWeightedScoreWins = [
    other_set[0],
    other_set[1]
  ]

  const vote_set = other_set.map((x,i,arr)=>{
    let totalVotes = 0;
    if(confidenceWins.find(y=>x.cardId===y.cardId)) {totalVotes++}
    if(weightedWins.find(y=>x.cardId===y.cardId)) {totalVotes++}
    if(averageWins.find(y=>x.cardId===y.cardId)) {totalVotes++}
    if(expectedWins.find(y=>x.cardId===y.cardId)) {totalVotes++}

    let firstPlaceVotes = 0;
    if(confidenceWins.findIndex(y=>x.cardId===y.cardId)===0) {firstPlaceVotes++}
    if(weightedWins.findIndex(y=>x.cardId===y.cardId)===0) {firstPlaceVotes++}
    if(averageWins.findIndex(y=>x.cardId===y.cardId)===0) {firstPlaceVotes++}
    if(expectedWins.findIndex(y=>x.cardId===y.cardId)===0) {firstPlaceVotes++}

    let secondPlaceVotes = 0;
    if(confidenceWins.findIndex(y=>x.cardId===y.cardId)===1) {secondPlaceVotes++}
    if(weightedWins.findIndex(y=>x.cardId===y.cardId)===1) {secondPlaceVotes++}
    if(averageWins.findIndex(y=>x.cardId===y.cardId)===1) {secondPlaceVotes++}
    if(expectedWins.findIndex(y=>x.cardId===y.cardId)===1) {secondPlaceVotes++}

    x.totalVotes = totalVotes
    x.firstPlaceVotes = firstPlaceVotes
    x.secondPlaceVotes = secondPlaceVotes
    x.comboVotes = 10 * firstPlaceVotes + 8 * secondPlaceVotes
    return x
  })

  const winner_set = vote_set.sort((a,b)=>b.comboVotes-a.comboVotes)
  const leader = winner_set[0]

  console.log('winner_set: ', 
    winner_set//, 
    // winner_set.map(x=>{
    //   const url = x.url
    //   console.log(url)
    //   return url
    // })
    )
  for (let x of winner_set) {
    if (!x) continue;
    console.log(x.url);
  }
  console.log('leader: ', leader, leader.url)

  const willing_to_pay = {
    100: 0,
    90: 1,
    80: 1,
    70: 2,
    60: 6,
    50: 8,
    40: 10,
    30: 1,
    20: 1,
    10: 0
  }

  const pay_set = winner_set.map((item,i,arr)=>{
    const confidence = getWillingToPay(item,willing_to_pay)
    item.confidenceToPay = confidence
    item.willingToPay = confidence * item.comboVotes
    return item
  })

  sort(pay_set, (a,b)=>b.willingToPay-a.willingToPay)
  console.log('sorted by willingToPay decreasing: ', 
    pay_set//, 
    // pay_set.map(
    //   x=>{
    //     const url = x.url
    //     console.log(url)
    //     return url
    //   }
    // )
  )
  for (let x of pay_set) {
    if (!x) continue;
    console.log(x.url);
  }

  const paySetWins = [
    pay_set[0],
    pay_set[1]
  ]
  const pay_leader = paySetWins[0]

  console.log(
    'pay_wins_set:',
    paySetWins//,
    // (() => {
    //   for (let x of paySetWins) {
    //     if (!x) continue;
    //     console.log(x.url);
    //   }
    // })()
  );
  for (let x of paySetWins) {
    if (!x) continue;
    console.log(x.url);
  }
  console.log('pay leader: ', pay_leader, pay_leader.url)
  }
  
  //-------------------Phase 13 -------
  const upDownGrades = computeUpandDownGrades(rows,watermarks)
  //-------------------Phase 14 -------
  // console.log('before reordered columns: ', rows)
  reorderColumns(rows)
  // console.log('after reorder columns: ', rows)
  //-------------------Phase 15 -------
  applyFilters(rows)
  //-------------------Phase 16 -------
  decide(rows)
  //-------------------Phase 17 -------
  return rows;
  //-------------------Phase 18 -------
  //show(finised)
}

// chrome runner
// (async () => {

//     const rows = await extract();

//     console.log(rows);
//     output(rows)

// })();

// module.exports = {
//     extract
// };