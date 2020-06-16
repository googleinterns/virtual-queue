<template>
  <div class="Queue">
    <h1>Welcome to the Queue page</h1>
    <br />
    <h2>Your UserID is : {{ uid }}</h2>
    <br />
    <h2>You are in Store : {{ storeId }}</h2>
    <div v-if="isUserLoaded">
      <div v-if="!isUserEnrolled">
        <h2>The size of the queue is : {{ queueLength }}</h2>
      </div>
      <div v-else>
        <h2>Your position in the queue is : {{ queuePosition }}</h2>
        <h2>Your token number is : {{tokenNumber}}</h2>
      </div>
      <button :disabled="isUserEnrolled" @click="enterQueue">
        Enter Queue
      </button>
      <br /><br />
      <button :disabled="!isUserEnrolled" @click="exitQueue">
        Leave Queue
      </button>
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
    };
  },
  methods: {
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
    queueInc: function(snap) {
      this.queueLength += snap.numChildren() / 2;
    },
    queueDec: function(snap) {
      // Decrementing Queue Length
      this.queueLength -= snap.numChildren() / 2;

      // Decrementing Queue Position
      if (this.isUserEnrolled) {
        var currentKey = this.currentUserKey;
        if (snap.numChildren() == 2) {
          if (currentKey > snap.key) {
            this.queuePosition--;
          }
        } else {
          snap.forEach(function(childSnap) {
            if (currentKey > childSnap.key) {
              this.queuePosition--;
            }
          });
        }
      }
    },
  },
  created() {
    this.userInit();
  },
  mounted() {
    // Listening to changes in the queue
    database_call.setQueueIncListener(this.storeId, this.queueInc);
    database_call.setQueueDecListener(this.storeId, this.queueDec);
  },
};
</script>
