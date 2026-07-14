function removeDuplicates(rows){

    const seen = new Map();

    for(const row of rows){

        if(!seen.has(row.id))
            seen.set(row.id, row);

    }

    return [...seen.values()];
}
function removeMissingPrice(rows){

    return rows.filter(r => r.monthlyRent != null);

}
function removeMissingTitle(rows){

    return rows.filter(r => r.title);

}
function removeSales(rows){

    return rows.filter(r =>

        r.monthlyRent < 30000000

    );

}
function normalizeTitle(title){

    if(!title)
        return null;

    return title
        .replace(/\s+/g,' ')
        .trim();

}
function normalizeCity(city){

    if(!city)
        return null;

    return city
        .replace(/\s+/g,' ')
        .trim();

}
function clean(rows) {

    rows = removeDuplicates(rows);
    rows = removeMissingPrice(rows);
    rows = removeMissingTitle(rows);
    rows = removeSales(rows);
    rows.forEach(r => {
        r.title = normalizeTitle(r.title);
        r.city = normalizeCity(r.city);
    });

    rows.sort(
        (a,b)=>a.monthlyRent-b.monthlyRent
    );
    return rows;

}

module.exports = {
    clean
};