const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const app = require('./initFirebase.js')
var utils = require('./utils.js');
const authService = require('./authService.js')

const db = getFirestore();

/**
 * Get users not approved
 * @params void
 * @return
 */
 exports.getNotApprovedUsers = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    const queryAdminUserId = await db.collection("users").where("id", "==", request.body.userId).get();
    const userAdmin = queryAdminUserId.docs.map((doc) => {
        return doc.data()
    });

    functions.logger.info("[getNotApprovedUsers] userAdmin: ", userAdmin[0]);
    /** check if user is admin */
    if (!userAdmin[0] || !userAdmin[0].admin) {
        const responseKo = {
            message: "Utente non amministratore, azione non possibile"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    const queryUser = await db.collection("users")
        .where("approved", "==", false)
    .get();

    const users = queryUser.docs.map((doc) => {
        return doc.data();
    });
    functions.logger.info("[getNotApprovedUsers] users: ",JSON.stringify(users));
    let newUsers = users.map(user => {
        functions.logger.info("[getNotApprovedUsers] user: ", JSON.stringify(user) );
        functions.logger.info("[getNotApprovedUsers] user: ", user.name);
        functions.logger.info("[getNotApprovedUsers] user: ", user.surname);
        user.name = utils.decrypt(user.name);
        user.surname =utils.decrypt(user.surname);
        return user;
    });

    response.send(newUsers);

});

exports.getUserById = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

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

    const token = request.header("token");
    await authService.authUser(token, response);

    functions.logger.info("[updateUser] request: ", JSON.stringify(request.body));

    const querySnapshot = await db.collection("users").where("id", "==", request.body.userId).get();
    const user = querySnapshot.docs.map((doc) => {
        return doc.data()
    });

    functions.logger.info("[updateUser] user: ", JSON.stringify(user[0]));

    if (!user[0]) {
        const responseKo = {
            message: "Utente non esistente"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    /**
     * Se veine modificato il nickname eseguiamo
     * l'update della tabella ranking che contiene il nickname
     */
     const hasNicknameChanged = user[0].nickname = request.body.nickname;

     if (hasNicknameChanged) {
         // update ranking
         await utils.updateRankingNickname(request.body.userId, request.body.nickname);
     }

    user[0].surname = utils.encrypt(request.body.surname);
    user[0].name = utils.encrypt(request.body.name);
    user[0].nickname = request.body.nickname;
    user[0].email = request.body.email;
    // don't override password if not in input request
    user[0].password = request.body.password ? utils.encrypt(request.body.password + user[0].id) : user[0].password;
    user[0].description = request.body.description;

    functions.logger.info("[updateUser] new user: ", JSON.stringify(user[0]));
    const res = await db.collection('users').doc(user[0].id).set(user[0]);

    user[0].name = utils.decrypt(user[0].name);
    user[0].surname = utils.decrypt(user[0].surname);
    response.send(user[0]);

});


/**
 * Approve User, only for admin
 * @params adminUserId, userId
 * @return string
 */
 exports.approveUser = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

    const queryAdminUserId = await db.collection("users").where("id", "==", request.body.adminUserId).get();
    const userAdmin = queryAdminUserId.docs.map((doc) => {
        return doc.data()
    });

    functions.logger.info("[approveUser] userAdmin: ", userAdmin[0]);
    /** check if user is admin */
    if (!userAdmin[0] || !userAdmin[0].admin) {
        const responseKo = {
            message: "Utente non amministratore, azione non possibile"
        }
        response.status(500).send(responseKo);
        response.end();
        return;
    }

    /** update user */
    db.collection('users').doc(request.body.userId).update({
        'approved': true
    });

    /** L'utente approvato ha di base 100 punti */

    // add record on UserCoin
    let userCoin = {
        userId: request.body.userId,
        idAnnouncement: '',
        nCoin: 100
    };

    functions.logger.info('userCoin: ', JSON.stringify(userCoin));

    await db.collection('usercoins').add(userCoin);
    await utils.updateRanking(request.body.userId, userCoin.nCoin);

    utils.sendEmailUser(request.body.userId)

    response.send('User approved');

});

/**
 * Approve User, only for admin
 * @params adminUserId, userId
 * @return string
 */
exports.deleteUser = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const token = request.header("token");
    await authService.authUser(token, response);

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
        response.end();
        return;
    }

    const res = await db.collection('users').doc(request.body.userId).delete();

    response.send('Utente eliminato');

});
