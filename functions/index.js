const functions = require("firebase-functions");
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var utils = require('./utils.js');


// init databace only once
initializeApp();
const db = getFirestore();

exports.getUserById = functions.region("europe-west1").https.onRequest(async (request, response) => {
    let token = utils.generateToken()
    const querySnapshot = await db.collection("users").where("id", "==", request.body.userId).get();
    const user = querySnapshot.docs.map((doc) => {
        functions.logger.info("[getUserById] user data: ", doc.data());
        functions.logger.info("[getUserById] user id: ", doc.id);
        return doc.data()
    });
    user.token = token;
    response.send(user);
});


exports.login = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryUser = await db.collection("users")
        .where("email", "==", request.body.email)
        .where('password', '==', request.body.password)
        .get();

    const user = queryUser.docs.map((doc) => {
        functions.logger.info("[login] user data: ", doc.data());
        functions.logger.info("[login] user id: ", doc.id);
        return doc.data()
    });

    /* Check if already exists an open session for this user */
    const queryUserSession = await db.collection("usersessions")
    .where("userId", "==", user[0].id)
    .where('expiration', '>', Timestamp.now())
    .get();

    const userSession = queryUserSession.docs.map((doc) => {
        functions.logger.info("[login] userSession already exists");
        functions.logger.info("[login] userSession data: ", doc.data());
        return doc.data()
    });

    if (userSession[0]) {
        response.send(JSON.stringify(userSession[0]));
    }

    /**
     * 1. generare un token
     * 2. creare nuova riga su userSession
     */

    let token = utils.generateToken()

    const expirationTime = Timestamp.fromDate(utils.getNextDayDate())

    let dataToStore = {
        expiration: expirationTime,
        token: token,
        userId: user[0].id
    };

    // Add a new document in collection "usersessions" with ID 'token'
    const res = await db.collection('usersessions').doc(token).set(dataToStore);

    response.send(dataToStore);

});



