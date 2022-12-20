const functions = require("firebase-functions");
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')
var utils = require('./utils.js');
const authService = require('./authService.js')

const db = getFirestore();

/**
 * Get announcement by id
 * @params
 * @return
 */
exports.getAnnouncementById = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

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

    const token = request.header("token");
    await authService.authUser(token, response);

    /** Rimuovere i coin dall'utente che ha creato il corso
     *  se non sono sufficienti, blocchiamo l'azione
    */
    const queryUserCoins = await db.collection("usercoins")
        .where("userId", "==", request.body.userId)
        .get();

    const userCoins = queryUserCoins.docs.map((doc) => {
        return doc.data();
    });

    let total = userCoins.map(userCoin => userCoin.nCoin).filter(coin => coin != undefined).reduce((sum, li) => sum + li, 0)
    functions.logger.info('[getUserScore] total: ', total);

    // se coin non sufficienti per l'annuncio, e non corso dove vengono guadagnati punti
    if (total < (+request.body.coins) && (+request.body.idCategory) != 1) {
        const responseKo = {
            message: "Coin non sufficienti per creare l'annuncio"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }
    else {

        /** Default approved id category NOT courses */
        let dataToStore = {
            registrationDate: Timestamp.now(),
            description: request.body.description,
            idCategory: (+request.body.idCategory), // cast to number
            userId: request.body.userId,
            place: request.body.place,
            partecipantsNumber: (+request.body.partecipantsNumber),
            approved: (+request.body.idCategory) == 1 ? false : true,
            date: request.body.date,
            hours: request.body.hours,
            status: 'open',
            coins: (+request.body.coins), // cast to number
            title: request.body.title,
            userApplied: []
        };

        functions.logger.info("[insertAnnouncement] dataToStore:", dataToStore);

        const res = await db.collection('announcements').add(dataToStore);

        db.collection('announcements').doc(res.id).update({
            'id': res.id
        });

        dataToStore.id = res.id;

        if ((+request.body.idCategory) != 1) {

            /** aggiungere record con punti negativi */
            let userCoin = {
                userId: request.body.userId,
                idAnnouncement: dataToStore.id,
                nCoin: (dataToStore.coins)*-1
            };

            functions.logger.info('userCoin: ', JSON.stringify(userCoin));

            await db.collection('usercoins').add(userCoin);
            await utils.updateRanking(request.body.userId, userCoin.nCoin);
        }

        response.send(dataToStore);
    }

});

/**
 * Get all announcement list function
 * @params
 * @return
 */
exports.getAllAnnouncements = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    functions.logger.info("[getAllAnnouncement] request:", request);
    functions.logger.info("[getAllAnnouncement] request headers:", request.headers);
    const announcementsQuery = await db.collection('announcements').get()
    let announcements = announcementsQuery.docs.map(doc => doc.data());
    functions.logger.info("[getAllAnnouncement] announcements:", announcements);
    announcements = announcements.filter(announcement => announcement.userId != request.body.userId)
        .filter(announcement => announcement.approved == true)
        .filter(announcement => {
            functions.logger.info("[getAllAnnouncement] userApplied length:", announcement.userApplied.length);
            functions.logger.info("[getAllAnnouncement] partecipantsNumber:", announcement.partecipantsNumber);
            functions.logger.info("[getAllAnnouncement] idAnnouncement:", announcement, " filter ", announcement.userApplied.length < announcement.partecipantsNumber);
            return announcement.userApplied.length < announcement.partecipantsNumber
        })
        .filter(announcement => announcement.status == 'open')
        .filter(announcement => !announcement.userApplied.includes(request.body.userId))
    // remove announcement of caller and not approved or maximum partecipants

    response.send(announcements);

});

/**
 * Get announcement by user id
 * @params
 * @return
 */
exports.getAnnouncementsByUserId = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    const queryAnnouncements = await db.collection("announcements")
        .where("userId", "==", request.body.userId)
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

    const token = request.header("token");
    await authService.authUser(token, response);

    const queryAnnouncements = await db.collection("announcements")
        .where("id", "==", request.body.id)
        .get();

    const announcements = queryAnnouncements.docs.map((doc) => {
        return doc.data();
    });
    functions.logger.info('[applyToAnnouncement] announcements: ', announcements);

    // verificare se l'utente si è già applicato per questo annuncio
    if (announcements[0].userApplied.includes(request.body.userId)) {
        functions.logger.info('[applyToAnnouncement] utente già applicato per questo annuncio');
        const responseKo = {
            message: "Utente già applicato per questo annuncio"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    // se corso, vengono scalati coin a chi si applica e non guadagnati
    // verificare che l'utente abbia i coin sufficienti
    let userCoins = await utils.getUserCoins(request.body.userId);
    functions.logger.info('[applyToAnnouncement] userCoins:', userCoins);
    // se è un corso
    if (announcements[0].idCategory == 1) {
        functions.logger.info('[applyToAnnouncement] inside if');
        // se coin non sufficienti per l'annuncio, e non corso dove vengono guadagnati punti
        if (userCoins < announcements[0].coins) {
            const responseKo = {
                message: "Coin non sufficienti per applicarsi al corso"
            }
            response.status(500).send(responseKo);
            response.end();
            return;
        }
        // scrivere su usercoins per togliere i coin dell'iscrizione
        let userCoin = {
            userId: request.body.userId,
            idAnnouncement: announcements[0].id,
            nCoin: (announcements[0].coins *-1)
        };

        functions.logger.info('userCoin: ', JSON.stringify(userCoin));

        await db.collection('usercoins').add(userCoin);
        await utils.updateRanking(request.body.userId, userCoin.nCoin);
    }

    db.collection("announcements").doc(request.body.id).update({
        "userApplied": FieldValue.arrayUnion(request.body.userId)
    });

    /** Default approved id category NOT courses */
    let dataToStore = {
        date: Timestamp.now(),
        idAnnouncement: request.body.id,
        userId: request.body.userId,
        status: true
    };

    const res = await db.collection('applications').add(dataToStore);

    db.collection('applications').doc(res.id).update({
        'id': res.id
    });

    dataToStore.id = res.id

    response.send(dataToStore);

});

/**
 * Approve announcement, only for admin
 * @params id
 * @params userId
 * @return
 */
exports.approveAnnouncement = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    functions.logger.info("[approveAnnouncement] request:", JSON.stringify(request.body));
    functions.logger.info("[approveAnnouncement] request:", request.body.coins);

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
        response.end();
        return;
    }

    if (!user || !user.data() || !user.data().admin) {
        const responseKo = {
            message: "Azione non ammessa per questo utente, è necessario il ruolo di amministratore"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    db.collection("announcements").doc(request.body.id).update({
        "approved": true,
        "coins": request.body.coins ? +request.body.coins : queryAnnouncement.data().coins
    });

    response.send("OK");

});

/**
 * Delete announcement
 * @params userId, announcementId
 * @return
 */
exports.deleteAnnouncement = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    console.log('[deleteAnnouncement] request: ', JSON.stringify(request.body) );
    const user = await db.collection("users")
        .doc(request.body.userId)
        .get();

    const announcement = await db.collection("announcements")
        .doc(request.body.announcementId)
        .get();

    if (!user.data()) {
        const responseKo = {
            message: "Utente non registrato"
        }
        response.status(500).send(responseKo);
        response.end()
        return;
    }

    if (!announcement.data()) {
        const responseKo = {
            message: "Annuncio non esistente"
        }
        response.status(500).send(responseKo);
        response.end()
        return;
    }
    if (announcement.data().userApplied.length) {
        const responseKo = {
            message: "Non è possibile completare l'azione, esistono utenti applicati per questo annuncio"
        }
        response.status(500).send(responseKo);
        response.end()
        return;
    }

    console.log('[deleteAnnouncement] user: ', JSON.stringify(user.data()) );
    console.log('[deleteAnnouncement] announcement: ', JSON.stringify(announcement.data()));

    if (!user.data().admin && user.id != announcement.data().userId) {

        console.log('[deleteAnnouncement] inside if');
        const responseKo = {
            message: "Attenzione questo annuncio non appartiene all'utente richiedente"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    const res = await db.collection('announcements').doc(request.body.announcementId).delete();

    /** se non corso riassegnare i punti */
    if (announcement.data().idCategory != 1) {

        /** riaccreditare i punti */
        let userCoin = {
            userId: announcement.data().userId,
            idAnnouncement: announcement.data().id,
            nCoin: announcement.data().coins
        };

        functions.logger.info('userCoin: ', JSON.stringify(userCoin));

        await db.collection('usercoins').add(userCoin);
        await utils.updateRanking(request.body.userId, userCoin.nCoin);

     }

    response.send('Annuncio eliminato');
});

/**
 * Get announcement where the user has applied
 * @params userId
 * @return
 */
exports.getAnnouncementsAppliedByUserId = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    const queryApplications = await db.collection("applications")
        .where("userId", "==", request.body.userId)
        .get();

    const applications = queryApplications.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info("[getAnnouncementsAppliedByUserId] applications: ", JSON.stringify(applications));

    let annoucementIds = applications.map(application => application.idAnnouncement);

    if (!annoucementIds.length) {
        response.send(annoucementIds);
        response.end();
        return;
    }

    functions.logger.info("[getAnnouncementsAppliedByUserId] annoucementIds: ", JSON.stringify(annoucementIds));


    const queryAnnouncements = await db.collection("announcements")
        .where("id", "in", annoucementIds)
        .get();

    const announcements = queryAnnouncements.docs.map((doc) => {
        return doc.data();
    });

    response.send(announcements);

});


/**
 * Get announcement of category course to approve (Admin users only)
 * @params userId
 * @return
 */
exports.getCoursesToApprove = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    const user = await db.collection("users")
        .doc(request.body.userId)
        .get();

    if (!user || !user.data() || !user.data().admin) {
        const responseKo = {
            message: "Azione non ammessa per questo utente, è necessario il ruolo di amministratore"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    const announcementsQuery = await db.collection('announcements').get()
    let announcements = announcementsQuery.docs.map(doc => doc.data())
    functions.logger.info("[getCoursesToApprove] announcements: ", JSON.stringify(announcements));
    announcements = announcements.filter(announcement => announcement.approved == false && announcement.idCategory == 1);

    functions.logger.info("[getCoursesToApprove] filtered announcements: ", JSON.stringify(announcements));
    //&& announcement.idCategory == 1

    response.send(announcements);

});

/**
 * Approve Course (Admin users only)
 * @params userId, announcementId
 * @return string
 */
exports.approveCourse = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    const user = await db.collection("users")
        .doc(request.body.userId)
        .get();

    if (!user || !user.data() || !user.data().admin) {
        const responseKo = {
            message: "Azione non ammessa per questo utente, è necessario il ruolo di amministratore"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    /** update announcements */
    db.collection('announcements').doc(request.body.announcementId).update({
        'approved': true
    });

    response.send('Course approved');

});

