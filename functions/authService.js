const functions = require("firebase-functions");
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')
var utils = require('./utils.js');

const db = getFirestore();

exports.authUser = async function (token, response) {

    token = token ? token : 'token';

    console.log("[authUser] token:", token);
    const queryUserSession = await db.collection("usersessions")
        .where("token", "==", token)
        .where('expiration', '>', Timestamp.now())
        .get();

    const userSession = queryUserSession.docs.map((doc) => {
        return doc.data();
    });

    console.log("[authUser] userSession:", JSON.stringify(userSession));

    if (!userSession[0]) {
        functions.logger.info('[authUser] user token not valid');
        const responseKo = {
            message: "Token non valido, eseguire di nuovo la login"
        }
        response.status(401).send(responseKo);
        response.end();
        return;
    }

    // update expiration date (+24h)
    const newExpirationTime = Timestamp.fromDate(utils.getNextDayDate())
    console.log("[authUser] old expiration time %s newExpirationTime %s",userSession[0].expiration, newExpirationTime);
    db.collection('usersessions').doc(token).update({
        'expiration': newExpirationTime
    });

    return true;

}

/**
 * Get application by user id
 * @params
 * @return
 */
 exports.refreshToken = functions.region("europe-west1").https.onRequest(async (request, response) => {

    functions.logger.info("[refreshToken] token: ", request.body.token);

    //check if token exists
    const queryUserSession = await db.collection("usersessions")
        .where("token", "==", request.body.token)
        .get();

    const userSession = queryUserSession.docs.map((doc) => {
        return doc.data();
    });

    console.log('[logout] userSession: ', userSession[0]);

    if (!userSession[0]) {
        /** Session not present */
        const responseKo = {
            message: "Sessione non presente"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    const expirationTime = Timestamp.fromDate(utils.getNextDayDate())

    let dataToStore = {
        expiration: expirationTime,
        token: token,
        userId: userSession[0].userId
    };

    functions.logger.info("[refreshToken] usersession dataToStore: ", dataToStore);

    // Add a new document in collection "usersessions" with ID 'token'
    const res = await db.collection('usersessions').doc(token).set(dataToStore);

    response.send(dataToStore)

});