import Vue from 'vue'
import firebase from 'firebase'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false
let app = '';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_PROJECT_ID + '.firebaseapp.com',
  databaseURL: "https://" + process.env.VUE_APP_FIREBASE_PROJECT_ID + '.firebaseio.com',
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_PROJECT_ID + '.appspot.com',
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

