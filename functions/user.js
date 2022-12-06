const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')

const db = getFirestore();

/**
 * Get users not approved
 * @params void
 * @return
 */
 exports.getNotApprovedUsers = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryUser = await db.collection("users")
        .where("approved", "==", false)
    .get();

    const user = queryUser.docs.map((doc) => {
        return doc.data();
    });

    response.send(user);

});

exports.getUserById = functions.region("europe-west1").https.onRequest(async (request, response) => {

    functions.logger.info("[getUserById] userId: ", request.body.userId);
    const querySnapshot = await db.collection("users").where("id", "==", request.body.userId).get();
    const user = querySnapshot.docs.map((doc) => {
        functions.logger.info("[getUserById] user data: ", doc.data());
        functions.logger.info("[getUserById] user id: ", doc.id);
        return doc.data()
    });

    response.send(user);

});

exports.updateUser = functions.region("europe-west1").https.onRequest(async (request, response) => {

    //validateToken
    functions.logger.info("[updateUser] user: ", JSON.stringify(request.body));

    const querySnapshot = await db.collection("users").where("email", "==", request.body.email).get();
    const user = querySnapshot.docs.map((doc) => {
        functions.logger.info("[getUserById] user data: ", doc.data());
        functions.logger.info("[getUserById] user id: ", doc.id);
        return doc.data()
    });

    if (!user[0]) {
        const responseKo = {
            message: "Utente non esistente"
        }
        response.status(500).send(responseKo);
        response.end()
    }

    user[0].surname = request.body.surname;
    user[0].name = request.body.name;
    user[0].nickname = request.body.nickname;
    user[0].email = request.body.email;
    // don't override password if not in input
    user[0].password = request.body.password ? utils.encrypt(request.body.password + user[0]) : user[0].password;
    user[0].description = request.body.description;

    functions.logger.info("[updateUser] new user: ", JSON.stringify(user[0]));
    const res = await db.collection('users').doc(user[0].id).set(user[0]);

    response.send(user);

});


/**
 * Approve User, only for admin
 * @params adminUserId, userId
 * @return string
 */
 exports.approveUser = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryAdminUserId = await db.collection("users").where("id", "==", request.body.adminUserId).get();
    const userAdmin = queryAdminUserId.docs.map((doc) => {
        return doc.data()
    });

    functions.logger.info("[updateUser] userAdmin: ", userAdmin[0]);
    /** check if user is admin */
    if (!userAdmin[0] || !userAdmin[0].admin) {
        const responseKo = {
            message: "Utente non amministratore, azione non possibile"
        }
        response.status(500).send(responseKo);
        response.end()
    }

    /** update user */
    db.collection('users').doc(request.body.userId).update({
        'approved': true
    });

    response.send('User approved');

});
