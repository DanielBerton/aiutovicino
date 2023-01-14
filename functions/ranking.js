const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
var utils = require('./utils.js');
const authService = require('./authService.js')

/**
 * getUserScore
 * @params userId
 * @return coins number
 */
 exports.getUserScore = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    functions.logger.info("[getUserScore] request headers token:", token);
    await authService.authUser(token, response);

    functions.logger.info('[getUserScore] get score for user: ', request.body.userId);

    const res = await getScore(request.body.userId);
    response.send(res);
});

/**
 * getRanking
 * @params void
 * @return coins number
 */
 exports.getRanking = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    functions.logger.info("[getUserScore] request headers token:", token);
    await authService.authUser(token, response);

    const queryRanking = await db.collection("ranking")
        .orderBy('nCoin', 'desc')
        .get();

    const allRanking = queryRanking.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info('allRanking: ', JSON.stringify(allRanking));
    response.send(allRanking);
});

const getScore = module.exports.getScore = async function(userId) {
    const queryUserCoins = await db.collection("usercoins")
        .where("userId", "==", userId)
        .get();

    const userCoins = queryUserCoins.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info('[getScore] userCoins: ', JSON.stringify(userCoins));

    let coins = userCoins.map(userCoin => userCoin.nCoin);

    functions.logger.info('[getScore] coins: ', coins);

    let total = userCoins.map(userCoin => userCoin.nCoin).filter(coin => coin != undefined).reduce((sum, li) => sum + li, 0)
    functions.logger.info('[getScore] total: ', total);

    const res = {
        "score": total ? total : 0
    }

    return res;
}