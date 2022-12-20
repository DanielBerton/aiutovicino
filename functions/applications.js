const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')
const authService = require('./authService.js')
var utils = require('./utils.js');

const db = getFirestore();

/**
 * Get application by user id
 * @params
 * @return
 */
 exports.getUserApplications = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    const queryApplications = await db.collection("applications")
        .where("userId", "==", request.body.userId)
    .get();

    const applications = queryApplications.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info('[getUserApplications] applications: ', applications);

    response.send(applications);

});

/**
 * Confirm an application to another useer
 * @params
 * @return
 */
 exports.applicationConfirmation = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    // get user data
    const queryUser = await db.collection("users").where("id", "==", request.body.userId).get();
    const user = queryUser.docs.map((doc) => {
        return doc.data()
    });

    functions.logger.info("[applicationConfirmation] user: ", JSON.stringify(user));

    // chage announcements status to completed
    const queryAnnouncements = await db.collection("announcements")
    .where("id", "==", request.body.idAnnouncement)
    .get();

    const announcements = queryAnnouncements.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info('[applicationConfirmation] announcements: ', announcements);

    /* non è possibile confermare corsi già chiusi
    * per i corsi, il primo utente che da conferma permette di trasferire i coin
    * poi lo status non è più open, quindi non vengono trasferiti altri punti
    */
    if (announcements[0].status == 'completed') {
        functions.logger.info('[applicationConfirmation] questo annuncio risulta già in stato completato');
        const responseKo = {
            message: "Questo annuncio risulta già in stato completato"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    functions.logger.info('announcement idCategory: ', announcements[0].idCategory);

    if (announcements[0].idCategory == 1) {
        // scrivere su usercoins per aggiungere i coin a chi ha creato il corso
        let userCoin = {
            userId: announcements[0].userId,
            idAnnouncement: announcements[0].id,
            nCoin: announcements[0].coins
        };

        functions.logger.info('userCoin: ', JSON.stringify(userCoin));

        await db.collection('usercoins').add(userCoin);
        await utils.updateRanking(announcements[0].userId, userCoin.nCoin);
    }
    else {

        // dare i punti a chi ha completato l'annuncio se non è corso
        // per ogni utente sottoscritto creare un userCoin
        announcements[0].userApplied.forEach(async userId => {

            functions.logger.info('Inside for userId: ', userId);
            let userCoin = {
                userId: userId,
                idAnnouncement: request.body.idAnnouncement,
                nCoin: announcements[0].coins
            };

            functions.logger.info('userCoin: ', JSON.stringify(userCoin));

            await db.collection('usercoins').add(userCoin);
            await utils.updateRanking(userId, userCoin.nCoin);
        });
        // for any userApplied => userCoins

    }

    // cambiare lo status dell'annuncio a completato
    db.collection('announcements').doc(request.body.idAnnouncement).set({
        'status': 'completed'
    }, { merge: true });

    response.send('OK');

});

// exports.test = functions.region("europe-west1").https.onRequest(async (request, response) => {

//     functions.logger.info("[testAuth] request headers authorization:", request.headers.authorization);

//     const token = request.header("token");
//     functions.logger.info("[testAuth] request token:", token);

//     // validateToken
//     let authObj = await authService.authUser(token);
//     if (!authObj.isAuth) {
//         const responseKo = {
//             message: "Utente non autorizzato per questa azione"
//         }
//         response.status(401).send(responseKo);
//         response.end();
//     }

//     functions.logger.info("[getUserApplications] authObj: ", authObj);

//     const queryApplications = await db.collection("applications")
//         .where("userId", "==", request.body.userId)
//     .get();

//     const applications = queryApplications.docs.map((doc) => {
//         return doc.data();
//     });

//     response.send(utils.createResponse(authObj.token, applications));

// });