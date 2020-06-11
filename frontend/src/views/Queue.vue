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
import firebase from "firebase";
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
      queuePosition: 0
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
      let dbRef = firebase.database().ref();
      this.uid = firebase.auth().currentUser.uid;
      var that = this;
      dbRef.child("User/"+ this.uid + "/SubscribedStoreID").orderByChild("StoreID").equalTo(this.storeId).once("value",snapshot => {
        if (snapshot.exists()){
          that.isUserEnrolled = true;
          that.setQueuePosition();
          that.setCurrentStoreKey();
          that.isUserLoaded = true;
        }
        else{
          that.isUserEnrolled = false;
          that.isUserLoaded = true;
        }
      });
    },
    setQueuePosition: function() {
      let dbRef = firebase.database().ref();
      var that = this;
      dbRef.child("Store/"+this.storeId+"/UsersInQueue").once("value", snap => {
        var count = 1;
        var uid = that.uid;
        snap.forEach(function(childSnap){
          if(uid==childSnap.val().UserId){
            that.currentUserKey = childSnap.key;
            that.queuePosition = count;
            return true;
          }
          count++;
        });
      });
    },
    setCurrentStoreKey: function(){
      let dbRef = firebase.database().ref();
      var that = this;
      dbRef.child("User/"+this.uid+"/SubscribedStoreID").orderByChild("StoreID").equalTo(this.storeId).once("value", snap =>{
        if(snap.exists()){
          that.currentStoreKey = Object.keys(snap.val())[0];
        }
        else{
          console.log("Error: current store ref");
        }
      });
    },
    enterQueue: function() {
      let dbRef = firebase.database().ref();
      //Enter User to Queue
      this.queuePosition = this.queueLength + 1;
      var currentUserRef = dbRef.child("Store/"+this.storeId+"/UsersInQueue").push();
      this.currentUserKey = currentUserRef.key;
      currentUserRef.set({
        UserId : this.uid
      });
      this.isUserEnrolled = true;

      //Enter StoreID to SubscribedStoreID
      var currentStoreRef = dbRef.child("User/"+ this.uid + "/SubscribedStoreID").push();
      this.currentStoreKey = currentStoreRef.key;
      currentStoreRef.set({
        StoreID : this.storeId
      });
    },
    exitQueue: function(){
      let dbRef = firebase.database().ref();
      //Remove User from Queue
      dbRef.child("Store/"+this.storeId+"/UsersInQueue/"+this.currentUserKey).remove();
      this.isUserEnrolled = false;
      
      //Remove StoreID from SubscribedStoreID
      dbRef.child("User/"+ this.uid + "/SubscribedStoreID/"+this.currentStoreKey).remove();
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
    this.userInit();
  },
  mounted() {
    //Listening to changes in the queue
    let dbRef = firebase.database().ref();
    dbRef.child("Store/"+this.storeId+"/UsersInQueue").on("child_added", this.queueInc);
    dbRef.child("Store/"+this.storeId+"/UsersInQueue").on("child_removed", this.queueDec);
  }
};
</script>
