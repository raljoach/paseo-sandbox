function validate(rows){

    const issues=[];

    rows.forEach((r,i)=>{

        if(!r.id)
            issues.push([i,"Missing ID"]);

        if(!r.monthlyRent)
            issues.push([i,"Missing price"]);

        if(!r.title)
            issues.push([i,"Missing title"]);

        if(!r.city)
            issues.push([i,"Missing city"]);

    });

    return issues;

}

module.exports = {
    validate
};