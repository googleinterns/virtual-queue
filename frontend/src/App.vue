<template>
  <div id="app" class="page-container">
    <div class="content-wrap">
      <nav
        class="navbar is-light"
        role="navigation"
        aria-label="main navigation"
      >
        <div class="navbar-brand">
          <a class="navbar-item">
            <img src="./assets/google-icon.png" height="28" />
          </a>
          <a
            role="button"
            class="navbar-burger burger"
            aria-label="menu"
            aria-expanded="false"
            data-target="navbarBasicExample"
            @click="isOpen = !isOpen"
            v-bind:class="{ 'is-active': isOpen }"
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
        <div
          id="navbarBasicExample"
          class="navbar-menu"
          v-bind:class="{ 'is-active': isOpen }"
        >
          <div class="navbar-start">
            <a class="navbar-item" @click="isOpen = !isOpen">
              <router-link :to="{ name: 'Home' }">
                Home
              </router-link>
            </a>
            <a class="navbar-item" @click="isOpen = !isOpen">
              <router-link :to="{ name: 'Search' }">
                Search
              </router-link>
            </a>
            <hr class="navbar-divider" />
          </div>
          <div class="navbar-end">
            <a class="navbar-item" v-if="isLoggedIn" @click="isOpen = !isOpen">
              <a @click="logout">Logout</a>
            </a>
            <a class="navbar-item" v-if="!isLoggedIn" @click="isOpen = !isOpen">
              <router-link :to="{ name: 'Login' }">
                Login
              </router-link>
            </a>
            <a class="navbar-item" v-if="!isLoggedIn" @click="isOpen = !isOpen">
              <router-link :to="{ name: 'SignUp' }">
                Sign Up
              </router-link>
            </a>
          </div>
        </div>
      </nav>
      <router-view />
    </div>
    <footer id="footer">
      <div class="content has-text-centered">
        <p>
          Virtual Queues: Making your shopping experience efficient and
          <b>safe.</b>
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import { database_call } from "./database.js";
export default {
  name: "nav-bar",
  data() {
    return {
      isLoggedIn: false,
      userId: null,
      isOpen: false,
    };
  },
  methods: {
    logout: function() {
      database_call.logoutUser();
      this.$router.push({ name: "Search" });
    },
    setUserId: function(user) {
      if (user) {
        this.userId = user.uid;
        this.isLoggedIn = true;
      } else {
        this.userId = null;
        this.isLoggedIn = false;
      }
    },
  },
  created() {
    database_call.setLoginListener(this.setUserId);
  },
};
</script>

<style>
@import "./assets/styles/App.css";
</style>
