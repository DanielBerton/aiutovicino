const CryptoJS = require("crypto-js");
const functions = require("firebase-functions");
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')
const db = getFirestore();

module.exports.generateToken = function () {
    var rand = function () {
        return Math.random().toString(36).substr(2); // remove `0.`
    };

    var token = function () {
        return rand() + rand(); // to make it longer
    };

    return token();
}

module.exports.getNextDayDate = function () {
    let date = new Date()
    console.log(date)
    date.setDate(date.getDate() + 1);

    return date;
}

module.exports.encrypt = function (string) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(string));
}

module.exports.decrypt = function (string) {
    return CryptoJS.enc.Base64.parse(string).toString(CryptoJS.enc.Utf8);
}

module.exports.updateRanking = async function (userId, coins) {

    const queryUserId = await db.collection("users").where("id", "==", userId).get();
    const user = queryUserId.docs.map((doc) => {
        return doc.data()
    });

    // add or update ranking for this user
    const queryRanking = await db.collection("ranking")
        .where("userId", "==", userId)
        .get();

    const userRanking = queryRanking.docs.map((doc) => {
        return doc.data();
    });
    functions.logger.info('userRanking: ', JSON.stringify(userRanking));

    if (userRanking && userRanking[0]) {
        // instance for this user exists, add coins to this record
        let totalCoins = userRanking[0].nCoin + coins
        functions.logger.info('userRanking exists, update coins totalCoins: ', totalCoins);
        db.collection("ranking").doc(userRanking[0].id).update({ nCoin: totalCoins });

    }
    else {
        functions.logger.info('userRanking do not exists, create new instance');
        const ranking = {
            userId: userId,
            userNickname: user[0].nickname,
            nCoin: coins
        };

        functions.logger.info('store object ranking:', JSON.stringify(ranking));
        const res = await db.collection('ranking').add(ranking);
        db.collection('ranking').doc(res.id).update({
            'id': res.id
        });
    }
}

module.exports.updateRankingNickname = async function (userId, nickname) {

    functions.logger.info('updateRankingNickname userId: [%s] nickname: [%s]', userId, nickname);
    functions.logger.info('updateRankingNickname userId: [%s] nickname: [%s]', userId, nickname);

    // add or update ranking for this user
    const queryRanking = await db.collection("ranking")
        .where("userId", "==", userId)
        .get();

    const userRanking = queryRanking.docs.map((doc) => {
        return doc.data();
    });
    functions.logger.info('userRanking: ', JSON.stringify(userRanking));

    if (userRanking && userRanking[0]) {
        // update userNickname with new nickname
        db.collection("ranking").doc(userRanking[0].id).update({ userNickname: nickname });
    }
}

module.exports.getUserCoins = async function (userId) {
    const queryUserCoins = await db.collection("usercoins")
        .where("userId", "==", userId)
        .get();

    const userCoins = queryUserCoins.docs.map((doc) => {
        return doc.data();
    });

    let total = userCoins.map(userCoin => userCoin.nCoin).filter(coin => coin != undefined).reduce((sum, li) => sum + li, 0)
    functions.logger.info('[utils.getUserCoins] total: ', total);

    return total;
}
