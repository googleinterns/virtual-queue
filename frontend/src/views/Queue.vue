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
      waitingTime: 0
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
    getToken: function(callBack){
      let dbRef = firebase.database().ref();
      debugger;
      var currentTokenRef = dbRef.child("Store/"+this.storeId+"/CurrentToken");
      currentTokenRef.transaction(function(currentToken){
        debugger;
        return currentToken + 1;
      }, function(error, committed, token){
        if(error){
          console.log(error);
        }
        else if(!committed){
          console.log("Commit error: No data is returned");
        }
        else{
          debugger;
          callBack(token.val());
          debugger;
        }
      });
      debugger;
    },
    enterQueue: function() {
      let dbRef = firebase.database().ref();
      debugger;
      var that = this;
      this.getToken(function(token){
        debugger;
        console.log("adding user");
        //Enter User to Queue
        var currentUserRef = dbRef.child(database_call.getUserPath(that.storeId)).push();
        that.currentUserKey = currentUserRef.key;

        //Enter StoreID to SubscribedStoreID
        var currentStoreRef = dbRef.child(database_call.getStorePath(that.uid)).push();
        that.currentStoreKey = currentStoreRef.key;

        var updateQueue = {};
        updateQueue[database_call.getUserPath(that.storeId)+"/"+that.currentUserKey] = {
          UserID : that.uid,
          Token : token
        };
        updateQueue[database_call.getStorePath(that.uid)+"/"+that.currentStoreKey] = {
          StoreID : that.storeId
        };

        dbRef.update(updateQueue, function(error){
          if(error){
            console.log(error);
          }
          else{
            that.isUserEnrolled = true;
            that.queuePosition = that.queueLength;
          }
        });
      });
    },
    exitQueue: function(){
      let dbRef = firebase.database().ref();

      var updateQueue = {};
      //remove user from Queue
      updateQueue[database_call.getUserPath(this.storeId)+"/"+this.currentUserKey] = {
        UserID : null,
        Token : null
      };
      //remove store from Subscribed Store ID
      updateQueue[database_call.getStorePath(this.uid)+"/"+this.currentStoreKey] = {
        StoreID : null
      };

      var that = this;
      dbRef.update(updateQueue, function(error){
        if(error){
          console.log(error);
        }
        else{
          that.isUserEnrolled = false;
        }
      });
    },
    queueInc: function(snap){
      this.queueLength += snap.numChildren()/2;
    },
    queueDec: function(snap){
      //Decrementing Queue Length
      this.queueLength -= snap.numChildren()/2;

      //Decrementing Queue Position
      if(this.isUserEnrolled){
        var currentKey = this.currentUserKey;
        if(snap.numChildren()==2){
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
    let dbRef = firebase.database().ref();
    dbRef.child(database_call.getUserPath(this.storeId)).on("child_added", this.queueInc);
    dbRef.child(database_call.getUserPath(this.storeId)).on("child_removed", this.queueDec);
  }
};
</script>
