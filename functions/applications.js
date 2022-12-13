const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')

const db = getFirestore();

/**
 * Get application by user id
 * @params
 * @return
 */
 exports.getUserApplications = functions.region("europe-west1").https.onRequest(async (request, response) => {

    // validateToken
    const queryApplications = await db.collection("applications")
        .where("userId", "==", request.body.userId)
    .get();

    const applications = queryApplications.docs.map((doc) => {
        return doc.data();
    });

    response.send(applications);

});

/**
 * Confirm an application to another useer
 * @params
 * @return
 */
 exports.applicationConfirmation = functions.region("europe-west1").https.onRequest(async (request, response) => {

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

    const announcement = queryAnnouncements.docs.map((doc) => {
        return doc.data();
    });

    functions.logger.info('announcement: ', announcement);

    db.collection('announcements').doc(request.body.idAnnouncement).set({
        'status': 'completed'
    }, { merge: true });

    functions.logger.info('announcement idCategory: ', announcement[0].idCategory);

    // add record on UserCoin
    let userCoin = {
        userId: request.body.userId,
        idAnnouncement: request.body.idAnnouncement,
        nCoin: announcement[0].coins
    };

    functions.logger.info('userCoin: ', JSON.stringify(userCoin));

    await db.collection('usercoins').add(userCoin);

    // add or update ranking for this user
    const queryRanking = await db.collection("ranking")
        .where("userId", "==", request.body.userId)
        .get();

    const userRanking = queryRanking.docs.map((doc) => {
            return doc.data();
        });
    functions.logger.info('userRanking: ', JSON.stringify(userRanking));

    if (userRanking && userRanking[0]) {
        // instance for this user exists, add coins to this record
        let totalCoins = userRanking[0].nCoin + announcement[0].coins
        functions.logger.info('userRanking exists, update coins totalCoins: ', totalCoins);
        db.collection("ranking").doc(userRanking[0].id).update({nCoin: totalCoins});

    }
    else {
        functions.logger.info('userRanking do not exists, create new instance');
        const ranking = {
            userId: request.body.userId,
            userNickname: user[0].nickname,
            nCoin: announcement[0].coins
        };

        functions.logger.info('store object ranking:', JSON.stringify(ranking));
        const res = await db.collection('ranking').add(ranking);
        db.collection('ranking').doc(res.id).update({
            'id': res.id
        });
    }


    response.send('OK');

});

