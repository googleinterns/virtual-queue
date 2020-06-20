<template>
  <div>
    <div class="outer">
      <div class="middle">
        <h1 class="title is-3">Sign Up</h1>
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
              <button class="button is-info full" @click="signup">
                Register
              </button>
            </p>
          </div>
        </div>
        <span>
          or go back to
          <router-link to="/login">login</router-link>
        </span>
      </div>

    </div>
          <footer class="footer">
        <div class="content has-text-centered">
          <p>
            <strong>Bulma</strong> by
            <a href="https://jgthms.com">Jeremy Thomas</a>. The source code is
            licensed
            <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.
            The website content is licensed
            <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/"
              >CC BY NC SA 4.0</a
            >.
          </p>
        </div>
      </footer>
  </div>
</template>

<script>
import firebase from "firebase";
export default {
  name: "signup",
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    signup: function() {
      var that = this;
      firebase
        .auth()
        .createUserWithEmailAndPassword(this.email, this.password)
        .then(
          () => {
            that.$router.push({ name: "Home" });
            alert("Your account has been created!");
          },
          (err) => {
            alert("Oops. " + err.message);
          }
        );
    },
  },
};
</script>
