<template>
  <div class="login">
    <h3>Sign In</h3>
    <input type="text" v-model="email" placeholder="Email" />
    <br />
    <input type="password" v-model="password" placeholder="Password" />
    <br />
    <button @click="login">Connect</button>
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
      var that = this;
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(function() {
        firebase.auth().signInWithEmailAndPassword(that.email, that.password)
        .then(
          () => {
            that.$router.replace("map");
          },
          err => {
            alert("Oops," + err.message);
          }
        );
      })
      .catch(function(error) {
        console.log(error);
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
