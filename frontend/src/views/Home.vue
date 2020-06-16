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
