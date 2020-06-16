<template>
  <div class="Queue">
    <h1>Welcome to the Queue page</h1>
    <br>
      <h2>Your UserID is : {{uid}}</h2>
    <br>
      <h2>You are in Store : {{storeId}}</h2>
    <div v-if="isUserLoaded">
      <div v-if="!isUserEnrolled">
        <h2>The size of the queue is : {{queueLength}}</h2>
      </div>
      <div v-else>
        <h2>Your position in the queue is : {{queuePosition}}</h2>
      </div>
      <button :disabled="isUserEnrolled" @click="enterQueue">Enter Queue</button>
      <br><br>
      <button :disabled="!isUserEnrolled" @click="exitQueue">Leave Queue</button>
    </div>
    <br><br>
    <p><router-link :to="{ name: 'Maps' }">Back</router-link></p>
  </div>
</template>

<script>
import { database_call } from "../database.js";
// @ is an alias to /src

export default {
  name: "Queue",
  components: {},
  data(){
    return{
      storeId: this.$route.params.StoreId,
      uid: null,
      currentUserKey: null,
      currentStoreKey: null,
      isUserLoaded: false,
      isUserEnrolled: false,
      queueLength: 0,
      queuePosition: 0,
    }
  },
  methods: {
    userInit: function() {
      //Function to populate intial data values
      var that = this;

      this.uid = database_call.getUserId();

      console.log(this.uid);

      database_call.isUserInQueue(this.storeId, this.uid, function(isEnrolled){
        if(isEnrolled){
          that.isUserEnrolled = true;
          database_call.getQueuePosition(that.storeId, that.uid, function(queuePosition){
            that.queuePosition = queuePosition;
          });
          database_call.getCurrentUserKey(that.storeId, that.uid, function(currentUserKey){
            that.currentUserKey = currentUserKey;
          });
          database_call.getCurrentStoreKey(that.storeId, that.uid, function(currentStoreKey){
            that.currentStoreKey = currentStoreKey;
          });
        }
        else{
          that.isUserEnrolled = false;
        }
        that.isUserLoaded = true;
      });
    },
    enterQueue: function() {

      var that = this;
      database_call.addToQueue(this.storeId, this.uid, function(currentStoreKey, currentUserKey, error){
        if(error){
          console.log(error);
        }
        else{
          that.currentUserKey = currentUserKey;
          that.currentStoreKey = currentStoreKey;
          that.isUserEnrolled = true;
          that.queuePosition = that.queueLength;
        }
      });
    },
    exitQueue: function(){

      var that = this;
      database_call.removeFromQueue(this.storeId, this.uid, this.currentStoreKey, this.currentUserKey, function(error){
        if(error){
          console.log(error);
        }
        else{
          that.isUserEnrolled = false;
        }
      });
    },
    queueInc: function(snap){
      //Incrementing Queue Length
      this.queueLength += snap.numChildren();
    },
    queueDec: function(snap){
      //Decrementing Queue Length
      this.queueLength -= snap.numChildren();

      //Decrementing Queue Position
      if(this.isUserEnrolled){
        var currentKey = this.currentUserKey;
        if(snap.numChildren()==1){
          if(currentKey>snap.key){
            this.queuePosition--;
          }
        }
        else{
          snap.forEach(function(childSnap){
            if(currentKey>childSnap.key){
              this.queuePosition--;
            }
          });
        }
      }
    }
  },
  created() {
    this.userInit();
  },
  mounted() {
    //Listening to changes in the queue
    database_call.setQueueIncListener(this.storeId, this.queueInc);
    database_call.setQueueDecListener(this.storeId, this.queueDec);
  }
};
</script>
