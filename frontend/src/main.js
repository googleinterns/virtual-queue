import Vue from 'vue'
import firebase from 'firebase'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false
let app = '';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0Fz2aUBmqzt9CHNanezSwLFkNPT-05rg",
  authDomain: "authentication-e11db.firebaseapp.com",
  databaseURL: "https://authentication-e11db.firebaseio.com",
  projectId: "authentication-e11db",
  storageBucket: "authentication-e11db.appspot.com",
  messagingSenderId: "279797035543",
  appId: "1:279797035543:web:bbb0da1e44c300d94ee252",
  measurementId: "G-4Q5TLZMTVT"
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

