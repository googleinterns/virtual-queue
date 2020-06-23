<template>
  <div class="login">
    <div class="outer">
      <div class="middle">
        <h1 class="title is-3">Sign In</h1>
          <span v-html="loginContent"></span>
        <div class="inner box">
          <div class="field">
            <p class="control has-icons-left">
              <input
                class="input"
                v-model="email"
                type="email"
                placeholder="Email"
              />
              <span class="icon is-small is-left">
                <i class="fas fa-envelope"></i>
              </span>
            </p>
          </div>
          <div class="field">
            <p class="control has-icons-left">
              <input
                class="input"
                v-model="password"
                type="password"
                placeholder="Password"
              />
              <span class="icon is-small is-left">
                <i class="fas fa-lock"></i>
              </span>
            </p>
          </div>
          <div class="field">
            <p class="control">
              <button class="button is-info full" @click="login">
                Login
              </button>
            </p>
          </div>
        </div>
        <p>
          or sign in with Google
          <br />
          <button @click="googleSignIn" class="google-button">
            <img alt="Google Logo" src="../assets/google-icon.png" />
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import firebase from "firebase";
export default {
  name: "login",
  data() {
    return {
      email: "",
      password: "",
      loginContent: null,
    };
  },
  methods: {
    login: function() {
      var that = this;
      firebase
        .auth()
        .signInWithEmailAndPassword(this.email, this.password)
        .then(
          () => {
            that.$router.push({ name: "Home" });
          },
          (err) => {
            this.loginContent = '<div class="error-sign width-80">'+err.message+'</div>'
          }
        );
    },
    googleSignIn() {
      const provider = new firebase.auth.GoogleAuthProvider();
      var that = this;
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(() => {
          that.$router.push({ name: "Home" });
        })
        .catch((err) => {
          this.loginContent = '<div class="error-sign width-80">'+err.message+'</div>'
        });
    },
  },
};
</script>

<style scoped>
.google-button {
  width: 75px;
  background: white;
  padding: 10px;
  border-radius: 100%;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
  outline: 0;
  border: 0;
  margin: 2%;
}
.google-button:active {
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}
.google-button img {
  width: 100%;
}
</style>
