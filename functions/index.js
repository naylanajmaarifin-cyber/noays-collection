const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { sortProducts } = require("./sorting");

exports.sortProducts = onCall(
  { region: "asia-southeast2", maxInstances: 5, timeoutSeconds: 30 },
  request => {
    try {
      return sortProducts(request.data || {});
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
  }
);
