<template>
  <div v-if="enrollMultipleUsers" class="demo"></div>
</template>

<script>
import firebase from "firebase";
import { database_call } from "./database.js";
//import Queue from "./views/Queue.vue";
export default {
  name: "demo",
  data() {
    return {
      storeId: "ChIJockHsGkcDTkRAH3RpbifUEs",
      password: "password",
      userIdArray: [],
    };
  },
  methods: {
    enrollAndUnenrollMultipleUsers: function() {
      var number = 100;
      var userName;
      var promise = Promise.resolve("Success");
      // Create multiple emails
      for (userName = 1; userName <= number; userName++) {
        let email = "abcd" + userName.toString() + "@gmail.com";
        promise = promise.then(() =>
          addUserIdToArray(email, this.password, this.userIdArray)
        );
      }
      promise.then(() => {
        console.log(this.userIdArray);
      });
      // Store the userIds of users in userIdArray[]
      function addUserIdToArray(email, password, userIdArray) {
        return firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(() => {
            console.log("hi");
            var userid = firebase.auth().currentUser.uid;
            userIdArray.push(userid);
            console.log(userid);
            return firebase.auth().signOut();
          });
      }
      // Enroll multiple users in queue
      promise.then(() => {
        this.userIdArray.forEach((userId) => {
          promise = promise.then(() => {
            console.log("enter");
            console.log(userId);
            return new Promise(function(resolve) {
              setTimeout(resolve, 100);
            }).then(() => {
              return database_call.addToQueueAsync(this.storeId, userId);
            });
          });
        });
      });

      // Unenroll multiple users from queue
      promise.then(() => {
        this.userIdArray.forEach((userId) => {
          promise = promise.then(() => {
            console.log("exit");
            console.log(userId);
            return new Promise(function(resolve) {
              setTimeout(resolve, 1000);
            }).then(() => {
              return database_call.removeFromQueueAsync(this.storeId, userId);
            });
          });
        });
      });
    },
  },
  created() {
    this.enrollAndUnenrollMultipleUsers();
  },
};
</script>
