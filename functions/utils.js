const CryptoJS = require("crypto-js");
const functions = require("firebase-functions");
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});
const app = require('./initFirebase.js')
const db = getFirestore();

module.exports.generateToken = function () {
    var rand = function () {
        return Math.random().toString(36).substr(2); // remove `0.`
    };

    var token = function () {
        return rand() + rand(); // to make it longer
    };

    return token();
}

module.exports.getNextDayDate = function () {
    let date = new Date()
    console.log(date)
    date.setDate(date.getDate() + 1);

    return date;
}

module.exports.encrypt = function (string) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(string));
}

var decrypt = module.exports.decrypt = function (string) {
    console.log("[decrypt] string: ", string)
    return CryptoJS.enc.Base64.parse(string).toString(CryptoJS.enc.Utf8);
}

module.exports.updateRanking = async function (userId, coins) {

    const queryUserId = await db.collection("users").where("id", "==", userId).get();
    const user = queryUserId.docs.map((doc) => {
        return doc.data()
    });

    // add or update ranking for this user
    const queryRanking = await db.collection("ranking")
        .where("userId", "==", userId)
        .get();

    const userRanking = queryRanking.docs.map((doc) => {
        return doc.data();
    });
    functions.logger.info('userRanking: ', JSON.stringify(userRanking));

    if (userRanking && userRanking[0]) {
        // instance for this user exists, add coins to this record
        let totalCoins = userRanking[0].nCoin + coins
        functions.logger.info('userRanking exists, update coins totalCoins: ', totalCoins);
        db.collection("ranking").doc(userRanking[0].id).update({ nCoin: totalCoins });

    }
    else {
        functions.logger.info('userRanking do not exists, create new instance');
        const ranking = {
            userId: userId,
            userNickname: user[0].nickname,
            nCoin: coins
        };

        functions.logger.info('store object ranking:', JSON.stringify(ranking));
        const res = await db.collection('ranking').add(ranking);
        db.collection('ranking').doc(res.id).update({
            'id': res.id
        });
    }
}

module.exports.updateRankingNickname = async function (userId, nickname) {

    functions.logger.info('updateRankingNickname userId: [%s] nickname: [%s]', userId, nickname);
    functions.logger.info('updateRankingNickname userId: [%s] nickname: [%s]', userId, nickname);

    // add or update ranking for this user
    const queryRanking = await db.collection("ranking")
        .where("userId", "==", userId)
        .get();

    const userRanking = queryRanking.docs.map((doc) => {
        return doc.data();
    });
    functions.logger.info('userRanking: ', JSON.stringify(userRanking));

    if (userRanking && userRanking[0]) {
        // update userNickname with new nickname
        db.collection("ranking").doc(userRanking[0].id).update({ userNickname: nickname });
    }
}

module.exports.getUserCoins = async function (userId) {
    const queryUserCoins = await db.collection("usercoins")
        .where("userId", "==", userId)
        .get();

    const userCoins = queryUserCoins.docs.map((doc) => {
        return doc.data();
    });

    let total = userCoins.map(userCoin => userCoin.nCoin).filter(coin => coin != undefined).reduce((sum, li) => sum + li, 0)
    functions.logger.info('[utils.getUserCoins] total: ', total);

    return total;
}

module.exports.sendEmailUser = async function(userId) {

    const user = await db.collection("users")
    .doc(userId)
    .get();

    const credential = await db.collection("credentials")
    .doc('user-1')
    .get();

    console.log('[sendEmail] user email: %s', user.data().email);
    console.log('[sendEmail] credential email: %s', credential.data().email);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: credential.data().email,
            pass: decrypt(credential.data().password)
        }
      });

      const mailOptions = {
        to: user.data().email,
        subject: 'AiutoVicino - Utente approvato',
        html: "<p> Buongiorno "+ decrypt(user.data().name) + ","+
              "<br><br> la sua utenza è stata approvata. <br> Ora può accedere all'applicazione con le sue credenziali. </p>"+
              "<br>"+
              "<br>"+
              "<br>"+
              "Saluti,"+
              "<br>"+
              "<br>"+
              "Staff <b> AiutoVicino<b/>"
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

module.exports.sendEmailCourse = async function(announcementId) {

    const queryAnnouncements = await db.collection("announcements")
    .where("id", "==", announcementId)
    .get();

    const announcements = queryAnnouncements.docs.map((doc) => {
        return doc.data();
    });

    const user = await db.collection("users")
    .doc(announcements[0].userId)
    .get();

    const credential = await db.collection("credentials")
    .doc('user-1')
    .get();

    console.log('[sendEmail] user email: %s', user.data().email);
    console.log('[sendEmail] credential email: %s', credential.data().email);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: credential.data().email,
            pass: decrypt(credential.data().password)
        }
      });

      const mailOptions = {
        to: user.data().email,
        subject: 'AiutoVicino - Corso approvato',
        html: "<p> Buongiorno "+ decrypt(user.data().name) + ","+
              "<br><br> il corso da lei creato è stato approvato. </p>"+
              "<br>"+
              "<br>"+
              "<br>"+
              "Saluti,"+
              "<br>"+
              "<br>"+
              "Staff <b> AiutoVicino<b/>"
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}
