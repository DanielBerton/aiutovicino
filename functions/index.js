const functions = require("firebase-functions");
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
var utils = require('./utils.js');
exports.applications = require('./applications');
exports.announcements = require('./announcements');
exports.user = require('./user');
exports.categories = require('./categories');

const app = require('./initFirebase.js')

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
    if (!user || !user[0] || !user[0].approved || request.body.password+user[0].id != utils.decrypt(user[0].password)) {
        const responseKo = {
            message: "Utente non registrato/approvato o credenziali sbagliate"
        }
        response.status(500).send(responseKo);
        response.end()
    }

    functions.logger.info('-------- ID --------', user[0].id)

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

    user[0].expiration = expirationTime,
    user[0].token = token;

    // Add a new document in collection "usersessions" with ID 'token'
    const res = await db.collection('usersessions').doc(token).set(dataToStore);

    response.send(user);

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

    console.log('User: ', user, ' is present: ', user , user.length)
    if (user.length) {
        const responseKo = {
            message: "Utente già registrato con questa email"
        }
        response.status(500).send(responseKo);
        response.end()
    }

    let dataToStore = {
        date: Timestamp.now(),
        description: request.body.description,
        email : request.body.email,
        name : request.body.name,
        surname : request.body.surname,
        nickname : request.body.nickname,
        approved: false,
        admin: false
    };

    // Add a new document in collection "users"
    const res = await db.collection('users').add(dataToStore);

    db.collection('users').doc(res.id).update({
        'id': res.id,
        'password' : utils.encrypt(request.body.password+res.id) // cocncat password and id, then encrypt password
      });

    console.log('Added document with ID: ', res.id);
    dataToStore.id = res.id;

    response.send(dataToStore);
    response.end()

});

