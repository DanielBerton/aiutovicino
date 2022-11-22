
module.exports.generateToken = function () {
    var rand = function() {
        return Math.random().toString(36).substr(2); // remove `0.`
    };

    var token = function() {
        return rand() + rand(); // to make it longer
    };

    return token();
}

module.exports.getNextDayDate = function() {
    let date = new Date()
    console.log(date)
    date.setDate(date.getDate() + 1);

    return date;
}

