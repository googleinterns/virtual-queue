<template>
  <div class="sign-up">
    <p>Let's create a new account!</p>
    <input type="text" v-model="email" placeholder="Email" />
    <br />
    <input type="password" v-model="password" placeholder="Password" />
    <br />
    <button @click="signup">Sign Up</button>
    <p>OR</p>
    <button @click="googleSignIn">SignUp with Google</button>
    <span>
      or go back to
      <router-link to="/login">login</router-link>.
    </span>
  </div>
</template>

<script>
import firebase from "firebase";
export default {
  name: "signup",
  data() {
    return {
      email: "",
      password: ""
    };
  },
  methods: {
    signup: function() {
      firebase
        .auth()
        .createUserWithEmailAndPassword(this.email, this.password)
        .then(
          () => {
            this.$router.replace("home");
            alert("Your account has been created!");
          },
          err => {
            alert("Oops. " + err.message);
          }
        );
    },
    googleSignIn: function() {
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(result => {
          console.log(result);
          console.log("Success");
          this.$router.replace("home");
        })
        .catch(function(error) {
          console.log(error);
          console.log("UnSuccessful");
        });
    }
  }
};
</script>

<style scoped>
.signup {
  margin-top: 40px;
}
input {
  margin: 10px 0;
  width: 20%;
  padding: 15px;
}
button {
  margin-top: 20px;
  width: 10%;
  cursor: pointer;
}
span {
  display: block;
  margin-top: 20px;
  font-size: 14px;
}
</style>
