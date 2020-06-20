<template>
  <div class="login">
    <div class="outer">
      <div class="middle">
        <h1 class="title is-3">Sign In</h1>
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
        <div class="g-signin2" data-onsuccess="onSignIn"></div>
        <p>
          or Sign In with Google
          <br />
          <button @click="googleSignIn" class="google-button">
            <img alt="Google Logo" src="../assets/google-icon.png" />
          </button>
        </p>
        <p>
          Don't have an account? You can
          <router-link to="/sign-up">create one</router-link>
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
            alert("Oops," + err.message);
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
          alert("Oops. " + err.message);
        });
    },
  },
};
</script>

<style scoped>
/* .login {
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
} */
.google-button {
  width: 75px;
  background: white;
  padding: 10px;
  border-radius: 100%;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
  outline: 0;
  border: 0;
}
.google-button:active {
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}
.google-button img {
  width: 100%;
}
</style>
