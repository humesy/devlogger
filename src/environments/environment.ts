// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyCsqdcsjGdzJaGhKnyA5HInio8PfUqz7Ao",
    authDomain: "cloud-function-test-e93a3.firebaseapp.com",
    databaseURL: "https://cloud-function-test-e93a3.firebaseio.com",
    projectId: "cloud-function-test-e93a3",
    storageBucket: "cloud-function-test-e93a3.appspot.com",
    messagingSenderId: "617112645830"
  },
};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
