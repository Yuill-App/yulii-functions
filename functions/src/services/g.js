const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const fcm = admin.messaging();
exports.checkHealth = functions.https.onCall(async (data, context) => {
  return "The function is online";
});
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const title = data.title;
  const body = data.body;
  const token = data.token;
  try {
    const payload = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        body: body,
      },
    };
    const response = await fcm.sendToDevice([token], payload);
    return {
      success: true,
      response: "Successfully sent message: " + response,
    };
  } catch (error) {
    throw new functions.https.HttpsError(
        "invalid-argument", "Error: " + error);
  }
});