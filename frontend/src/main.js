import Vue from "vue";
import firebase from "firebase";
import App from "./App.vue";
import Demo from "./Demo.vue";
import router from "./router";
import * as VueGoogleMaps from "vue2-google-maps";
import "./../node_modules/bulma/css/bulma.css";
import HighchartsVue from "highcharts-vue";
import Highcharts from "highcharts";
import Annotations from "highcharts/modules/annotations.js";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { dom } from "@fortawesome/fontawesome-svg-core";
import VueClipboard from "vue-clipboard2";

dom.watch();

library.add(fas);
Vue.component("font-awesome-icon", FontAwesomeIcon);

Vue.use(HighchartsVue);
Annotations(Highcharts);
Vue.use(VueClipboard);

Vue.config.productionTip = false;
let app = "";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_PROJECT_ID + ".firebaseapp.com",
  databaseURL:
    "https://" + process.env.VUE_APP_FIREBASE_PROJECT_ID + ".firebaseio.com",
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_PROJECT_ID + ".appspot.com",
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APPID,
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID,
};
// Initialize Firebase

firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(() => {
  if (!app) {
    app = new Vue({
      router,
      render: (h) => h(App),
    }).$mount("#app");
  }
});

let demo = "";
if (!demo) {
  demo = new Vue({
    router,
    render: (h) => h(Demo),
  }).$mount("#demo");
}
// Initializing Vuejs maps library
Vue.use(VueGoogleMaps, {
  load: {
    key: process.env.VUE_APP_MAPS_API_KEY,
  },
});

Vue.use(require("vue-moment"));
