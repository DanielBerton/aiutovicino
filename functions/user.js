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
