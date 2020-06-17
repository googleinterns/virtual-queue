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
      <p>(People before token {{ startToken }} have been resolved)</p>
      <br />
      <line-chart
        class="container is-fluid is-8"
        :data="graph"
        xtitle="Token range"
        ytitle="Percentage of people resolved"
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
          <h2>Your waiting time is : {{ waitingTime }}</h2>
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
import { waiting_time } from "../waitingtime.js";

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
      startToken: 0,
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
            console.log("qP1: "+ queuePosition);
            that.queuePosition = queuePosition;
            that.currentUserKey = currentUserKey;
            that.tokenNumber = tokenNumber;
          });
          database_call.getCurrentStoreKey(that.storeId, that.uid, function(
            currentStoreKey
          ) {
            that.currentStoreKey = currentStoreKey;
          });
          waiting_time.getWaitingTimeEnrolled(
            that.storeId,
            that.uid,
            function(waitingTime) {
              that.waitingTime = waitingTime;
            }
          );
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
      waiting_time.getWaitingTimeEnrolled(that.storeId, that.userId, function(
        waitingTime
      ) {
        that.waitingTime = waitingTime;
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
          var that = this;
          waiting_time.getWaitingTimeEnrolled(
            that.storeId,
            that.userId,
            function(waitingTime) {
              that.waitingTime = waitingTime;
            }
          );
        }
      }
    },
    makeGraph: function(snap) {
      var lineGraph = [];
      var firstToken = 0,
        lastToken = 0;
      var firstTokenFlag = 0;
      snap.forEach(function(child) {
        if (firstTokenFlag == 0) {
          // firstTokenflag = 0 detects we are on first token
          firstToken = child.child(database_call.getTokenIdField()).val();
          firstTokenFlag = 1;
        }
        lastToken = Math.max(
          lastToken,
          child.child(database_call.getTokenIdField()).val()
        );
      });
      this.startToken = firstToken;
      var range = 20;
      // minMostToken is the token from where the graph starts
      var minMostToken = firstToken - (firstToken % range);
      // initialising ranges in lineGraph array
      for (
        var lowerBound = minMostToken;
        lowerBound < lastToken;
        lowerBound += range
      ) {
        var pair = [];
        var upperBound = lowerBound + range;
        var key = lowerBound.toString() + "-" + upperBound.toString();
        pair.push(key);
        // pushing 100 to replicate it with percentage
        pair.push(100);
        lineGraph.push(pair);
      }
      var factor = minMostToken / range;
      // decrementing the people in a range who are not yet resolved
      snap.forEach(function(child) {
        var tokenId = child.child(database_call.getTokenIdField()).val();
        var index = Math.floor(tokenId / range) - factor;
        // converting number of people into percentage of people resolved
        lineGraph[index][1] -= 100 / range;
      });
      this.graph = lineGraph;
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
    database_call.setPowerCurveListener(this.storeId, this.makeGraph);
  },
};
</script>
