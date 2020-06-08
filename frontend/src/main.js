import Vue from 'vue'
import firebase from 'firebase'
import App from './App.vue'
import router from './router'
import * as VueGoogleMaps from "vue2-google-maps";

Vue.config.productionTip = false
let app = '';
// Your web app's Firebase configuration
const firebaseConfig = {
<<<<<<< HEAD
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_PROJECT_ID + '.firebaseapp.com',
  databaseURL: "https://" + process.env.VUE_APP_FIREBASE_PROJECT_ID + '.firebaseio.com',
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_PROJECT_ID + '.appspot.com',
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APPID,
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID
=======
  apiKey: "AIzaSyC6ybwkhLl8KqQHHOwEr6HMaetCRM27_vo",
  authDomain: "database-queue.firebaseapp.com",
  databaseURL: "https://database-queue.firebaseio.com",
  projectId: "database-queue",
  storageBucket: "database-queue.appspot.com",
  messagingSenderId: "404151767225",
  appId: "1:404151767225:web:dc2da4bffb8c8d973d4b68"
>>>>>>> 2aed568... Redirection of marker + display of places started
};
// Initialize Firebase

firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(() => {
  if (!app) {
    app = new Vue({
      router,
      render: h => h(App)
    }).$mount('#app');
  }
});

Vue.use(VueGoogleMaps, {
  load: {
    key: "AIzaSyCu4bZPx3unoBtAr8YUzVfiBmw6oqZBk0g",
    libraries: "places" // necessary for places input
  }
});