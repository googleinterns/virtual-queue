## SignUp/Login page using Vuejs and Firebase Authentication

### Functions that you will get when you add Firebase Authentication:

* The first page that will come up will be the login page.
* You have to enter your email and password and click “connect” and you will be directed to the home page, otherwise if you don’t have an account then you would need to sign up, for that click on “create one”.
* Give your details on the signup page and click “sign up”.
* Now your account is created and you will be directed to the home page.
* If a person is not logged in and tries to access home page he will be directed to the login page.

**Important: Everything starts from the Home page.
Important: If a person is not logged in and he tries to access any other page apart from the ones mentioned in routes array in index.js, then he will be directed to the Login page automatically.**

### How to run the app?

* Install Vuejs: 

      $npm install -g @vue/cli
      
* Download the project from github and open the project inside the terminal:

      $npm run serve
      
* Login to firebase, click add project, enter your project name and click create project.
* Click on “Add firebase to your web app icon”. An api key would be generated in the project settings in the side bar. 
* Click on Config. Copy the code snippet having the apikey inside and paste it in the **main.js** file. 
* Open the project in another tab of terminal:

      $npm install firebase --save

### How to protect API key?
1. Rename .env_sample file in the main directory to .env .
2. Replace YourAPIKey to the api key you got when you connected your project to firebase 
3. Replace YourProjectID to the project id you got when you connected your project to firebase 

### Steps to include Firebase Authentication:

1. Changes to be made in main.js file:
      * Import firebase.
      
            import firebase from 'firebase'
            
      * Include the config with api key and project id. (Follow the steps in **How to protect API key?**) 
      * Include function _onAuthStateChanged()_

2. Changes to be made in index.js file:
      * Import firebase and the pages you have made
      
            import firebase from 'firebase'
            import Yourpage from '../views/Yourpage.vue'
            
      * Include the config with api key and project id. (Follow the steps in **How to protect API key?**) 
      * Include function _onAuthStateChanged()_
      * Put the path for your page in routes[]:
      
            {
                  path: '/yourpage',
                  name: 'Yourpage',
                  component: Yourpage,
                  meta: {
                        requiresAuth: true //If you want person to be authenticated before having 
                                          //access to this page then set it as true
                  }
            }

      * Include function _beforeEach()_:
      
            router.beforeEach((to, from, next) => {
                  const currentUser = firebase.auth().currentUser;
                  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
                  if (requiresAuth && !currentUser) next('login');
                  else next();
            })

3. The pages having the logout option will have these code snippets: 

           <template>  
            <div class="home">  
             <h1> Welcome to the Home page </h1>  
             <button @click="logout">Logout</button>  
            </div>  
           </template>  
   
           <script>  
            import firebase from "firebase";    
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
