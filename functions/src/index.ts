import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import { BitbucketUpdateHandler, Test } from './test';

admin.initializeApp();
//const cors = require('cors')({ origin: true });

exports.BitbucketUpdate = functions.https.onCall(async (data, context) => {
  await BitbucketUpdateHandler(data, context, admin)
});

// exports.BitbucketLanguageUpdate = functions.https.onCall(async (data, context) => {
//   await BitbucketLanguageHandler(data, context, admin)
// })

exports.Test = functions.https.onCall(async (data, context) => {
  Test(data, context, admin)
});
