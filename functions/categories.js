const functions = require("firebase-functions");
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');
const app = require('./initFirebase.js')

const db = getFirestore();

/**
 * Get categories list
 * @params void
 * @return category list
 */
 exports.getAllCategories = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryCategories = await db.collection("categories").get();

    const categories = queryCategories.docs.map((doc) => {
        return doc.data();
    });

    response.send(categories);
});

/**
 * Get categories list
 * @params id
 * @return
 */
 exports.getCategoryById = functions.region("europe-west1").https.onRequest(async (request, response) => {

    const queryCategory = await db.collection("categories")
    .where("id", "==", request.body.id)
    .get();

    const category = queryCategory.docs.map((doc) => {
        return doc.data();
    });

    response.send(category);
});