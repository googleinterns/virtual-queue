<template>
  <div class="Queue">
    <h1>Welcome to the Queue page</h1>
    <br>
      <h2>Your UserID is : {{uid}}</h2>
    <br>
      <h2>You are in Store : {{storeId}}</h2>
    <div v-if="isEnabled">
      <div v-if="isUserLoaded">
        <div v-if="!isUserEnrolled">
          <h2>The size of the queue is : {{queueLength}}</h2>
          <h2> The waiting time for this queue is: {{waitingTime}} </h2>
        </div>
        <div v-else>
          <h2>Your position in the queue is : {{queuePosition}}</h2>
          <h2> Your waiting time is: {{waitingTime}} </h2>
        </div>
        <button :disabled="isUserEnrolled" @click="enterQueue">Enter Queue</button>
        <br><br>
        <button :disabled="!isUserEnrolled" @click="exitQueue">Leave Queue</button>
      </div>
    </div>
    <div v-else>
      <h2>Queue Disabled.</h2>
    </div>
    <br><br>
    <p><router-link :to="{ name: 'Home' }">Back</router-link></p>
  </div>
</template>

<script>
import firebase from "firebase";
import { database_call } from "../database.js";
import { waiting_time } from "../waitingtime.js";
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
      waitingTime: 0,
      isEnabled: null
    }
  },
  methods: {
    logout: function() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.$router.replace("login");
        });
    },
    storeInit: function(){
      let dbRef = firebase.database().ref();
      var that = this;
      dbRef.child("Store/"+ this.storeId + "/IsEnabled").once("value", snap=>{
        that.isEnabled = snap.val();
      })
    },
    userInit: function() {
      //Function to populate intial data values
      let dbRef = firebase.database().ref();
      this.uid = firebase.auth().currentUser.uid;
      var that = this;
      dbRef.child(database_call.getStorePath(this.uid)).orderByChild("StoreID").equalTo(this.storeId).once("value",snapshot => {
        waiting_time.getWaitingTime(that.storeId, that.uid, function(waitingTime){
          that.waitingTime = waitingTime;
        });
        if (snapshot.exists()){
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
      let dbRef = firebase.database().ref();
      //Enter User to Queue
      this.queuePosition = this.queueLength + 1;
      var currentUserRef = dbRef.child(database_call.getUserPath(this.storeId)).push();
      this.currentUserKey = currentUserRef.key;
      currentUserRef.set({
        UserID : this.uid
      });
      this.isUserEnrolled = true;

      //Enter StoreID to SubscribedStoreID
      var currentStoreRef = dbRef.child(database_call.getStorePath(this.uid)).push();
      this.currentStoreKey = currentStoreRef.key;
      currentStoreRef.set({
        StoreID : this.storeId
      });
    },
    exitQueue: function(){
      let dbRef = firebase.database().ref();
      //Remove User from Queue
      dbRef.child(database_call.getUserPath(this.storeId)+"/"+this.currentUserKey).remove();
      this.isUserEnrolled = false;
      
      //Remove StoreID from SubscribedStoreID
      dbRef.child(database_call.getStorePath(this.uid)+"/"+this.currentStoreKey).remove();
    },
    queueInc: function(snap){
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
    this.storeInit();
    this.userInit();
  },
  mounted() {
    //Listening to changes in the queue
    let dbRef = firebase.database().ref();
    dbRef.child(database_call.getUserPath(this.storeId)).on("child_added", this.queueInc);
    dbRef.child(database_call.getUserPath(this.storeId)).on("child_removed", this.queueDec);
  }
};
</script>
