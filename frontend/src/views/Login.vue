<template>
  <div class="login">
    <h3>Sign In</h3>
    <input type="text" v-model="email" placeholder="Email" />
    <br />
    <input type="password" v-model="password" placeholder="Password" />
    <br />
    <br />
    <button @click="login">Connect</button>
    <p>OR</p>
    <button @click="googleSignIn">SignIn with Google</button>
    <br />
    <br />
    <p>
      You don't have an account? You can
      <router-link to="/sign-up">create one</router-link>
    </p>
  </div>
</template>

<script>
import firebase from "firebase";
export default {
  name: "login",
  data() {
    return {
      email: "",
      password: ""
    };
  },
  methods: {
    login: function() {
      firebase
        .auth()
        .signInWithEmailAndPassword(this.email, this.password)
        .then(
          () => {
            this.$router.replace("home");
          },
          err => {
            alert("Oops," + err.message);
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
.login {
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
p {
  margin-top: 40px;
  font-size: 14px;
}
p a {
  text-decoration: underline;
  cursor: pointer;
}
</style>
