const functions = require("firebase-functions");
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var utils = require('./utils.js');
const app = require('./initFirebase.js')
exports.applications = require('./applications');
exports.announcements = require('./announcements');
exports.user = require('./user');
exports.categories = require('./categories');
exports.ranking = require('./ranking');

const rankingService = require('./ranking');
const db = getFirestore();


/**
 * Login function
 * @params { "email": string, "password": string }
 * @return userSession Javascript Object
 * { "token": string, "userId": string, "expiration": timestamp}
 */
exports.login = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryUser = await db.collection("users")
        .where("email", "==", request.body.email)
        .get();

    const user = queryUser.docs.map((doc) => {
        return doc.data();
    });

    /* if user not present, not approved or wrong credential then return status 500 and error message */
    if (!user || !user[0] || !user[0].approved || request.body.password + user[0].id != utils.decrypt(user[0].password)) {
        const responseKo = {
            message: "Utente non registrato/approvato o credenziali sbagliate"
        }
        functions.logger.info('error: %s', responseKo)
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    functions.logger.info('-------- ID -------- [%s]', user[0].id)
    const score = await rankingService.getScore(user[0].id);

    /* Check if already exists an open session for this user */
    const queryUserSession = await db.collection("usersessions")
        .where("userId", "==", user[0].id)
        .where('expiration', '>', Timestamp.now())
        .get();

    const userSession = queryUserSession.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info("[login] userSession : ", JSON.stringify(userSession[0]));

    if (userSession[0]) {
        functions.logger.info("[login] return open session");
        // if session already exists and is valid, return the current session
        user[0].expiration = userSession[0].expiration,
        user[0].token = userSession[0].token;
        user[0].score = score.score;
        user[0].name = utils.decrypt(user[0].name);
        user[0].surname = utils.decrypt(user[0].surname);
        response.send(user[0]);
        return;
    }

    functions.logger.info("[login] userSession do not exists create new");
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

    user[0].expiration = expirationTime;
    user[0].token = token;
    user[0].score = score.score;
    user[0].name = utils.decrypt(user[0].name);
    user[0].surname = utils.decrypt(user[0].surname);

    response.send(user[0]);

});

/**
 * Registration function
 * @params { "email": string, "password": string }
 * @return userSession Javascript Object
 * { "token": string, "userId": string, "expiration": timestamp}
 */
exports.registration = functions.region("europe-west1").https.onRequest(async (request, response) => {

    // check if user already exists
    const queryUser = await db.collection("users")
        .where("email", "==", request.body.email)
        .get();

    const user = queryUser.docs.map((doc) => {
        return doc.data();
    });

    console.log('User: ', user, ' is present: ', user, user.length)
    if (user.length) {
        const responseKo = {
            message: "Utente già registrato con questa email"
        }
        response.status(500).send(responseKo);
        response.end()
        return;
    }

    let dataToStore = {
        date: Timestamp.now(),
        description: request.body.description,
        email: request.body.email,
        name: utils.encrypt(request.body.name),
        surname: utils.encrypt(request.body.surname),
        nickname: request.body.nickname,
        approved: false,
        admin: false
    };

    // Add a new document in collection "users"
    const res = await db.collection('users').add(dataToStore);

    db.collection('users').doc(res.id).update({
        'id': res.id,
        'password': utils.encrypt(request.body.password + res.id) // cocncat password and id, then encrypt password
    });

    console.log('Added document with ID: ', res.id);
    dataToStore.id = res.id;

    response.send(dataToStore);
    response.end();
    return;

});

/**
 * Logout function
 * @params { "token": string}
 * @return userSession Javascript Object
 * { "token": string, "userId": string, "expiration": timestamp}
 */
exports.logout = functions.region("europe-west1").https.onRequest(async (request, response) => {

    /* Delete user session */
    const queryUserSession = await db.collection("usersessions")
        .where("token", "==", request.body.token)
        .get();

    const userSession = queryUserSession.docs.map((doc) => {
        return doc.data();
    });

    console.log('[logout] userSession:', userSession);
    console.log('[logout] userSession first:', userSession[0]);

    if (!userSession[0]) {
        /** Session not present */
        const responseKo = {
            message: "Sessione non presente"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }
    const res = await db.collection('usersessions').doc(userSession[0].token).delete();

    response.send('OK');
    response.end();

});


exports.decrypt = functions.region("europe-west1").https.onRequest(async (request, response) => {

    let res = {
       word:  request.body.string,
       wordDecrypt : utils.decrypt(request.body.string)
    }
    response.send(res);
    response.end();
    return;

});