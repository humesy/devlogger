import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import { GithubUpdateHandler } from './test';

admin.initializeApp();
//const cors = require('cors')({ origin: true });

exports.GithubUpdate = functions.https.onCall(async (data, context)=>{
    await GithubUpdateHandler(data, context, admin)
  });
