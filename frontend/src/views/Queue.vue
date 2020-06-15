<template>
  <div class="Queue">
    <h1>Welcome to the Queue page</h1>
    <br />
    <h2>Your UserID is : {{ uid }}</h2>
    <br />
    <h2>You are in Store : {{ storeId }}</h2>

    <div v-if="isEnabled">
      <br />
      <br />
      <br />
      <h1 class="head">Current Queue Status</h1>
      <p>(People before token {{ starttoken }} have been resolved)</p>
      <br />
      <line-chart
        class="container is-fluid is-8"
        :data="graph"
        xtitle="Token range"
        ytitle="Number of people resolved"
      ></line-chart>
      <br />
      <br />
      <div v-if="isUserLoaded">
        <div v-if="!isUserEnrolled">
          <h2>The size of the queue is : {{ queueLength }}</h2>
        </div>
        <div v-else>
          <h2>Your position in the queue is : {{ queuePosition }}</h2>
          <h2>Your token number is : {{ tokenNumber }}</h2>
        </div>
        <button :disabled="isUserEnrolled" @click="enterQueue">
          Enter Queue
        </button>
        <br /><br />
        <button :disabled="!isUserEnrolled" @click="exitQueue">
          Leave Queue
        </button>
      </div>
    </div>
    <div v-else>
      <h2>Queue Disabled.</h2>
    </div>
    <br /><br />
    <p><router-link :to="{ name: 'Maps' }">Back</router-link></p>
  </div>
</template>

<script>
import { database_call } from "../database.js";

export default {
  name: "Queue",
  components: {},
  data() {
    return {
      storeId: this.$route.params.StoreId,
      uid: null,
      currentUserKey: null,
      currentStoreKey: null,
      isUserLoaded: false,
      isUserEnrolled: false,
      queueLength: 0,
      queuePosition: 0,
      tokenNumber: 0,
      isEnabled: null,
      waitingTime: 0,
      starttoken: 0,
      graph: [],
    };
  },
  methods: {
    // Set isEnabled of store
    storeInit: function() {
      var that = this;
      database_call.getIsEnabled(this.storeId, function(isEnabled) {
        that.isEnabled = isEnabled;
      });
    },
    // Function to populate intial data values
    userInit: function() {
      var that = this;
      this.uid = database_call.getUserId();
      database_call.isUserInQueue(this.storeId, this.uid, function(isEnrolled) {
        if (isEnrolled) {
          that.isUserEnrolled = true;
          database_call.getUserInfo(that.storeId, that.uid, function(
            queuePosition,
            currentUserKey,
            tokenNumber
          ) {
            that.queuePosition = queuePosition;
            that.currentUserKey = currentUserKey;
            that.tokenNumber = tokenNumber;
          });
          database_call.getCurrentStoreKey(that.storeId, that.uid, function(
            currentStoreKey
          ) {
            that.currentStoreKey = currentStoreKey;
          });
        } else {
          that.isUserEnrolled = false;
        }
        that.isUserLoaded = true;
      });
    },
    enterQueue: function() {
      var that = this;
      database_call.addToQueue(this.storeId, this.uid, function(
        currentStoreKey,
        currentUserKey,
        token,
        error
      ) {
        if (error) {
          console.log(error);
        } else {
          that.currentUserKey = currentUserKey;
          that.currentStoreKey = currentStoreKey;
          that.isUserEnrolled = true;
          that.queuePosition = that.queueLength;
          that.tokenNumber = token;
        }
      });
    },
    exitQueue: function() {
      var that = this;
      database_call.removeFromQueue(
        this.storeId,
        this.uid,
        this.currentStoreKey,
        this.currentUserKey,
        function(error) {
          if (error) {
            console.log(error);
          } else {
            that.isUserEnrolled = false;
          }
        }
      );
    },
    // Incrementing Queue Length
    queueInc: function() {
      this.queueLength++;
    },
    queueDec: function(snap) {
      // Decrementing Queue Length
      this.queueLength--;

      // Decrementing Queue Position
      if (this.isUserEnrolled) {
        if (this.currentUserKey > snap.key) {
          this.queuePosition--;
        }
      }
    },
    makegraph: function() {
      let dbref = firebase.database().ref();
      dbref
        .child("Store/" + this.storeId + "/UsersInQueue")
        .on("value", (snap) => {
          var linegraph = [];
          var firsttoken = 0;
          var lasttoken = 0;
          var temp = 0;
          snap.forEach(function(child) {
            if (temp == 0) {
              firsttoken = child.child("TokenId").val();
            } else firsttoken = Math.min(firsttoken, child.child("TokenId").val());
            lasttoken = Math.max(lasttoken, child.child("TokenId").val());
            temp++;
          });
          this.starttoken = firsttoken;
          var range = 20;
          range = Math.ceil((lasttoken - firsttoken) / 10);
          range = 20;

          firsttoken = firsttoken - (firsttoken % range);
          var counter = 0;
          var multi = firsttoken / range + 1;
          var l, r, left, right, key, value;
          snap.forEach(function(child) {
            if (child.child("TokenId").val() <= range * multi) counter++;
            else {
              r = range * multi;
              l = range * (multi - 1);
              left = l.toString();
              right = r.toString();
              key = left + "-" + right;
              value = range - counter;
              var pair = [];
              pair.push(key);
              pair.push(value);
              linegraph.push(pair);
              counter = 0;
              multi++;
              while (child.child("TokenId").val() > multi * range) {
                r = range * multi;
                l = range * (multi - 1);
                left = l.toString();
                right = r.toString();
                value = range - counter;
                key = left + "-" + right;
                var pair1 = [];
                pair1.push(key);
                pair1.push(value);
                linegraph.push(pair1);
                multi++;
              }
              counter = 1;
            }
          });
          r = range * multi;
          l = range * (multi - 1);
          left = l.toString();
          right = r.toString();
          key = left + "-" + right;
          value = range - counter;
          var pair2 = [];
          pair2.push(key);
          pair2.push(value);
          linegraph.push(pair2);
          this.graph = linegraph;
        });
    },
  },
  created() {
    this.storeInit();
    this.userInit();
  },
  mounted() {
    // Listening to changes in the queue
    database_call.setQueueIncListener(this.storeId, this.queueInc);
    database_call.setQueueDecListener(this.storeId, this.queueDec);
    this.makegraph();
  },
};
</script>
