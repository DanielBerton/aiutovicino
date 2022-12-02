const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')

const db = getFirestore();

/**
 * Get application by user id
 * @params
 * @return
 */
 exports.getAnnouncementById = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryApplications = await db.collection("announcements")
        .where("id", "==", request.body.id)
    .get();

    const applications = queryApplications.docs.map((doc) => {
        return doc.data();
    });

    response.send(applications);

});


/**
 * Inser announcement function
 * @params
 * @return
 */
 exports.insertAnnouncement = functions.region("europe-west1").https.onRequest(async (request, response) => {

    let dataToStore = {
        date : Timestamp.now(),
        description : request.body.description,
        idCategory : request.body.idCategory,
        idUser : request.body.idUser,
        place : request.body.place,
        partecipantsNumber : request.body.partecipantsNumber,
        approved: false
    };

    const res = await db.collection('announcements').add(dataToStore);

    db.collection('announcements').doc(res.id).update({
        'id': res.id
    });

    dataToStore.id = id

    response.send(dataToStore);

});

/**
 * Inser announcement function
 * @params
 * @return
 */
 exports.getAllAnnouncements = functions.region("europe-west1").https.onRequest(async (request, response) => {

    functions.logger.info("[getAllAnnouncement] request:", request);
    functions.logger.info("[getAllAnnouncement] request headers:", request.headers);
    const snapshot = await db.collection('announcements').get()
    let announcements = snapshot.docs.map(doc => doc.data());

    response.send(announcements);

});

