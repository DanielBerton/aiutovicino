const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');
const app = require('./initFirebase.js')

const db = getFirestore();
/**
 * Get application by user id
 * @params
 * @return
 */
 exports.getUserApplications = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryApplications = await db.collection("applications")
        .where("idUser", "==", request.body.idUser)
    .get();

    const applications = queryApplications.docs.map((doc) => {
        return doc.data();
    });

    response.send(applications);

});


