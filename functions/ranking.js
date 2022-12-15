const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

/**
 * getUserScore
 * @params userId
 * @return coins number
 */
 exports.getUserScore = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryUserCoins = await db.collection("usercoins")
        .where("userId", "==", request.body.userId)
        .get();

    const userCoins = queryUserCoins.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info('[getUserScore] userCoins: ', JSON.stringify(userCoins));

    let coins = userCoins.map(userCoin => userCoin.nCoin);

    functions.logger.info('[getUserScore] coins: ', coins);

    let total = userCoins.map(userCoin => userCoin.nCoin).filter(coin => coin != undefined).reduce((sum, li) => sum + li, 0)
    functions.logger.info('[getUserScore] total: ', total);

    const res = {
        "score": total ? total : 0
    }
    response.send(res);
});

/**
 * getRanking
 * @params void
 * @return coins number
 */
 exports.getRanking = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryRanking = await db.collection("ranking")
        .orderBy('nCoin', 'desc')
        .get();

    const allRanking = queryRanking.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info('allRanking: ', JSON.stringify(allRanking));
    response.send(allRanking);
});
