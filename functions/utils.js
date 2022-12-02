const CryptoJS = require("crypto-js");

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

module.exports.encrypt = function(string) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(string));
}

module.exports.decrypt = function(string) {
    return CryptoJS.enc.Base64.parse(string).toString(CryptoJS.enc.Utf8);
}

