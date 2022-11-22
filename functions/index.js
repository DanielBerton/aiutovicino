const functions = require("firebase-functions");
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var utils = require('./utils.js');


// init database only once
initializeApp();
const db = getFirestore();

exports.getUserById = functions.region("europe-west1").https.onRequest(async (request, response) => {
    let token = utils.generateToken()

    const querySnapshot = await db.collection("users").doc(request.body.userId).get();
    const user = querySnapshot.docs.map((doc) => {
        functions.logger.info("[getUserById] user data: ", doc.data());
        functions.logger.info("[getUserById] user id: ", doc.id);
        return doc.data()
    });
    user.token = token;
    response.send(user);
});

/**
 * Login function
 * @params { "email": string, "password": string }
 * @return userSession Javascript Object
 * { "token": string, "userId": string, "expiration": timestamp}
 */
exports.login = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryUser = await db.collection("users")
        .where("email", "==", request.body.email)
        .where('password', '==', request.body.password)
        .get();

    const user = queryUser.docs.map((doc) => {
        return doc.data();
    });

    /* if user not present or wrong credential then return status 500 and error message */
    if (!user.length) {
        const responseKo = {
            message: "Utente non registrato o credenziali sbagliate"
        }
        response.status(500).send(responseKo);
    }
    /* Check if already exists an open session for this user */
    const queryUserSession = await db.collection("usersessions")
        .where("userId", "==", user[0].id)
        .where('expiration', '>', Timestamp.now())
        .get();

    const userSession = queryUserSession.docs.map((doc) => {
        functions.logger.info("[login] userSession already exists");
        functions.logger.info("[login] userSession data: ", doc.data());
        return doc.data();
    });

    if (userSession[0]) {
        // if session already exists and is valid, return the current session
        response.send(userSession[0]);
    }

    /**
     * 1. generate new token
     * 2. create new instance of userSession
     */

    let token = utils.generateToken();

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

/**
 * Registration function
 * @params { "email": string, "password": string }
 * @return userSession Javascript Object
 * { "token": string, "userId": string, "expiration": timestamp}
 */
exports.registration = functions.region("europe-west1").https.onRequest(async (request, response) => {

    // check if user already exists


    let dataToStore = {
        id : "us-1",
        date: Timestamp.now(),
        description: request.body.description,
        email : request.body.email,
        name : request.body.name,
        surname : request.body.surname,
        nickname : request.body.nickname,
        password : request.body.password,
        approved: false
    };

    // Add a new document in collection "users"
    const res = await db.collection('users').add(dataToStore);

    console.log('Added document with ID: ', res.id);
    response.send(dataToStore);

});



