#### SignUp/Login page using Vuejs and Firebase Authentication

Functions that you will get when you add Firebase Authentication:

-The first page that will come up will be the login page.
-You have to enter your email and password and click “connect” and you will be directed to the home page, otherwise if you don’t have an account then you would need to sign up, for that click on “create one”.
-Give your details on the signup page and click “sign up”.
-Now your account is created and you will be directed to the home page.
-If a person is not logged in and tries to access home page he will be directed to the login page.

Important: Everything starts from the Home page.
Important: If a person is not logged in and he tries to access any other page apart from the ones mentioned in routes array in index.js, then he will be directed to the Login page automatically.

How to run the app?

-Install Vuejs: 
      $npm install -g @vue/cli
-Download the project from github and open the project inside the terminal:
      $npm run serve
-Login to firebase, click add project, enter your project name and click create project.
-Click on “Add firebase to your web app icon”. An api key would be generated in the project settings in the side bar. 
-Click on Config. Copy the code snippet having the apikey inside and paste it in the main.js file. 
-Open the project in another tab of terminal:
      $npm install firebase --save


Steps to include Firebase Authentication:

1. Changes to be made in main.js file:

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
  storageBucket: process.env.VUE_APP_FIREBASE_PROJECT_ID + '.appspot.com'
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


2. Changes to be made in index.js file:

import firebase from 'firebase'
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import SignUp from '../views/SignUp.vue'
Vue.use(VueRouter)
 
const routes = [
 {
   path: '/home',
   name: 'Home',
   component: Home,
   meta: {
     requiresAuth: true
   }
 },
 {
   path: '/login',
   name: 'Login',
   component: Login
 },
 {
   path: '/sign-up',
   name: 'SignUp',
   component: SignUp
 },
 {
   path: '*',
   redirect: '/login'
 },
 {
   path: '/',
   redirect: '/login'
 }
]
 
const router = new VueRouter({
 routes
})

router.beforeEach((to, from, next) => {
 const currentUser = firebase.auth().currentUser;
 const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
 if (requiresAuth && !currentUser) next('login');
 else next();
})
export default router

-Whenever a page needs authentication add:

  meta: {
     requiresAuth: true
   }

3. The pages having the logout option will have these code snippets:
<template>
 <div class="home">
   <h1>Welcome to the Home page</h1>
   <button @click="logout">Logout</button>
 </div>
</template>
 
<script>
import firebase from "firebase";
// @ is an alias to /src
 
export default {
 name: "Home",
 components: {},
 methods: {
   logout: function() {
     firebase
       .auth()
       .signOut()
       .then(() => {
         this.$router.replace("login");
       });
   }
 }
};
</script>
 

4. Include files SignUp.vue and Login.vue inside the project.
5. Open:  http://localhost:8080/ in the browser.
