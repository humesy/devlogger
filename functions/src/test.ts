import { take } from 'rxjs/operators';


// export const createUserRecord = functions.https.onRequest((request, response) => {
//     corsHandler(request, response, () => {
//         const userRef = db.doc(`users/ong`);
//         return userRef.set({
//             name: "skya",
//             nickname: 'ootz'
//         });
//     })
// })

// export function AddUserToPositionHandler(data, context, admin) {
//     const db = admin.firestore();
//     const uid = data.uid;
//     const login = data.login;
//     const accessToken = data.accessToken;

//     const userRef = db.doc(`github/${uid}`)
//     db.doc(`github/${uid}`).valueChanges().pipe(take(1)).subscribe(doc => {
//         if(!doc) {
//             //complete
//         }
//         else {
//             this.getGithubUserInfo
//         }
//     })

// }

export function GithubUpdateHandler(data, context, admin) {
  const db = admin.firestore();
  const uid = data.uid;
  //const login = data.login;
  //const accessToken = data.accessToken;

  //const userRef = db.doc(`github/${uid}`);
  db.doc(`github/${uid}`).valueChanges().pipe(take(1)).subscribe(doc => {
    if (!doc) {
      const userRef = db.doc(`users/noDoc`);
        return userRef.set({
            name: "nodoc"
        });
    }
  })
}
