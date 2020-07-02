<template>
  <div class="outer">
    <div class="middle">
      <h1 class="title is-3">Create Beautiful graph for any StoreId</h1>
      <div class="inner box">
        <div class="field">
          <p class="control">
            <input class="input" v-model="storeId" placeholder="Store Id" />
            <br />
            <button
              class="button is-info full"
              @click="enrollAndUnenrollMultipleUsers"
            >
              Populate
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { database_call } from "./database.js";
import firebase from "firebase";
export default {
  name: "demo",
  data() {
    return {
      //put the storeId which you want to populate
      storeId: "",
      password: "password",
      userIdArray: [],
      //random array determines the sequence of entry and exit of userIds
      //[index of userId, 1/0] :  1 for entry, 0 for exit
      random: [],
      // [Token range, Number of people, exit(0)/entry(1)] : Token range: 1=[1-20], 2=[21-40] likewise
      algo: [
        [1, 20, 1],
        [2, 20, 1],
        [1, 10, 0],
        [2, 5, 0],
        [3, 20, 1],
        [1, 8, 0],
        [2, 7, 0],
        [4, 20, 1],
        [3, 5, 0],
        [5, 21, 1],
        [3, 4, 0],
        [4, 5, 0],
        [5, 2, 0],
      ],
    };
  },
  methods: {
    enrollAndUnenrollMultipleUsers: function() {
      var number = 101;
      var userName;
      var promise = Promise.resolve("Success");

      // Create multiple emails
      for (userName = 1; userName <= number; userName++) {
        let email = "abcd" + userName.toString() + "@gmail.com";
        promise = promise.then(() =>
          addUserIdToArray(email, this.password, this.userIdArray)
        );
      }
      // Store the userIds of users in userIdArray[]
      function addUserIdToArray(email, password, userIdArray) {
        return firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(
            () => {
              var userid = firebase.auth().currentUser.uid;
              userIdArray.push(userid);
              console.log("Logged in" + userid);
              return;
            },
            () => {
              return firebase
                .auth()
                .createUserWithEmailAndPassword(email, password)
                .then(() => {
                  var userid = firebase.auth().currentUser.uid;
                  userIdArray.push(userid);
                  console.log("Signed up" + userid);
                });
            }
          );
      }
      //creating random Array
      promise.then(() => {
        console.log(this.userIdArray);
        var itr;
        // initialising random array
        for (itr = 0; itr <= number * 2; itr++) {
          this.random.push([-1, -1]);
        }
        // rangeItr array keeps the iterators for the tokens who have entered and exited the queue
        //[enter Iterator, exit Iterator]
        var rangeItr = [];
        rangeItr.push([0, 0]);
        for (itr = 0; itr < 5; itr++) {
          rangeItr.push([itr * 20, itr * 20]);
        }
        var it = 1;
        // populating the random array as guided by algo array
        for (var itrAlgo = 0; itrAlgo < this.algo.length; itrAlgo++) {
          var count = this.algo[itrAlgo][1];
          var currentRange = this.algo[itrAlgo][0];
          while (count--) {
            this.random[it][0] = rangeItr[currentRange][
              this.algo[itrAlgo][2]
            ]++;
            this.random[it++][1] = this.algo[itrAlgo][2];
          }
        }
      });

      // Calling removeUserFromQueue and addUserToQueue functions as guided by random array
      promise.then(() => {
        var it;
        var that = this;
        console.log(that.random);
        for (it = 1; that.random[it][0] != -1; it++) {
          let itr = it;
          if (that.random[itr][1] == 0) {
            promise = promise.then(() => {
              console.log(that.random[itr][0]);
              return removeUserFromQueue(
                that.userIdArray[that.random[itr][0]],
                that.storeId
              );
            });
          } else {
            promise = promise.then(() => {
              console.log(that.random[itr][0]);
              return addUserToQueue(
                that.userIdArray[that.random[itr][0]],
                that.storeId
              );
            });
          }
        }
      });

      // Enroll a user with userId in queue of storeId
      function addUserToQueue(userId, storeId) {
        console.log("enter" + userId);
        return new Promise(function(resolve) {
          setTimeout(resolve, 100);
        }).then(() => {
          return database_call.addToQueueAsync(storeId, userId);
        });
      }

      // Remove a user with userId from queue of storeId
      function removeUserFromQueue(userId, storeId) {
        console.log("exit" + userId);
        return new Promise(function(resolve) {
          setTimeout(resolve, 100);
        }).then(() => {
          return database_call.removeFromQueueAsync(storeId, userId);
        });
      }
    },
  },
};
</script>
