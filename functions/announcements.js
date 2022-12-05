const functions = require("firebase-functions");
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')

const db = getFirestore();

/**
 * Get announcement by id
 * @params
 * @return
 */
exports.getAnnouncementById = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryAnnouncements = await db.collection("announcements")
        .where("id", "==", request.body.id)
        .get();

    const announcements = queryAnnouncements.docs.map((doc) => {
        return doc.data();
    });

    response.send(announcements);

});


/**
 * Inser announcement function
 * @params
 * @return
 */
exports.insertAnnouncement = functions.region("europe-west1").https.onRequest(async (request, response) => {

    let dataToStore = {
        date: Timestamp.now(),
        description: request.body.description,
        idCategory: request.body.idCategory,
        idUser: request.body.idUser,
        place: request.body.place,
        partecipantsNumber: request.body.partecipantsNumber,
        approved: false
    };

    const res = await db.collection('announcements').add(dataToStore);

    db.collection('announcements').doc(res.id).update({
        'id': res.id
    });

    dataToStore.id = res.id

    response.send(dataToStore);

});

/**
 * Get all announcement list function
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

/**
 * Get announcement by user id
 * @params
 * @return
 */
exports.getAnnouncementsByUserId = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryAnnouncements = await db.collection("announcements")
        .where("idUser", "==", request.body.idUser)
        .get();

    const announcements = queryAnnouncements.docs.map((doc) => {
        return doc.data();
    });

    response.send(announcements);

});

/**
 * Get announcement by user id
 * @params
 * @return
 */
exports.applyToAnnouncement = functions.region("europe-west1").https.onRequest(async (request, response) => {

    // const queryAnnouncements = await db.collection("announcements")
    //     .doc(request.body.id)
    //     .get();

    // const announcements = queryAnnouncements.docs.map((doc) => {
    //     return doc.data();
    // });

    db.collection("announcements").doc(request.body.id).update({
        "userApplyed": request.body.userId
    });

    response.send("OK");

});


/**
 * Get announcement by user id
 * @params
 * @return
 */
 exports.applyToAnnouncement = functions.region("europe-west1").https.onRequest(async (request, response) => {

    // const queryAnnouncements = await db.collection("announcements")
    //     .doc(request.body.id)
    //     .get();

    // const announcements = queryAnnouncements.docs.map((doc) => {
    //     return doc.data();
    // });

    db.collection("announcements").doc(request.body.id).update({
        "userApplyed": request.body.userId
    });

    response.send("OK");

});

/**
 * Get announcement by user id
 * @params id
 * @params userId
 * @return
 */
 exports.approveAnnouncement = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const user = await db.collection("users")
    .doc(request.body.userId)
    .get();

    const queryAnnouncement = await db.collection("announcements")
    .doc(request.body.id)
    .get();

    if (!queryAnnouncement.data()) {
        const responseKo = {
            message: "Annuncio non esistente"
        }
        response.status(500).send(responseKo);
        response.end()
    }
    console.log('user: ', user);
    if (!user || !user.data() || !user.data().admin) {
        const responseKo = {
            message: "Azione non ammessa per questo utente, è necessario il ruolo di amministratore"
        }
        response.status(500).send(responseKo);
        response.end()
    }

    db.collection("announcements").doc(request.body.id).update({
        "userApplyed": request.body.userId
    });

    response.send("OK");

});

