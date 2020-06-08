<template>
  <div class="home">
    <h1>Welcome to the Home page</h1>
    <br>
    <div v-if="!isUserEnrolled">
      <h2>The size of the queue is : {{queueLength}}</h2>
    </div>
    <div v-else>
      <h2>Your position in the queue is : {{queuePosition}}</h2>
    </div>
    <button :disabled="isUserEnrolled" @click="enterQueue">Enter Queue</button>
    <br><br>
    <button :disabled="!isUserEnrolled" @click="exitQueue">Leave Queue</button>
    <br><br>
    <button @click="logout">Logout</button>
  </div>
</template>

<script>
import firebase from "firebase";
// @ is an alias to /src

export default {
  name: "Home",
  components: {},
  data(){
    return{
      currentUserRef: null,
      isUserEnrolled: false,
      storeID : 1,
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
      const dbRef = firebase.database().ref();
      const uid = firebase.auth().currentUser.uid;
      dbRef.child("User/"+ uid + "/SubscribedStoreID").orderByChild("StoreID").equalTo(this.storeID).once("value",snapshot => {
        if (snapshot.exists()){
          this.isUserEnrolled = true;
          this.setCurrentUserRef();
          this.setQueuePosition();
        }
        else{
          this.isUserEnrolled = false;
        }
      });
    },
    setQueuePosition: function() {
      const dbRef = firebase.database().ref();
      const uid = firebase.auth().currentUser.uid;
      dbRef.child("Queue").once("value", snap => {
        var count = 0;
        snap.forEach(function(childSnap){
          if(uid==childSnap.val().userId){
            return true;
          }
          count++;
        });
        this.queuePosition = count;
      });
    },
    setCurrentUserRef: function() {
      const dbRef = firebase.database().ref();
      const uid = firebase.auth().currentUser.uid;
      dbRef.child("Queue").orderByChild("UserId").equalTo(uid).once("value",snapshot => {
        if (snapshot.exists()){
          this.currentUserRef = snapshot.ref;
        }
        else{
          console.log("Doesn't exist");
        }
      });
    },
    enterQueue: function() {
      const dbRef = firebase.database().ref();
      const uid = firebase.auth().currentUser.uid;
      //Enter User to Queue
      this.queuePosition = this.queueLength + 1;
      this.currentUserRef = dbRef.child("Queue").push();
      this.currentUserRef.set({
        UserId : firebase.auth().currentUser.uid
      });
      this.isUserEnrolled = true;
      //Enter StoreID to SubscribedStoreID
      var storeRef = dbRef.child("User/"+ uid + "/SubscribedStoreID").push();
      storeRef.set({
        StoreID : this.storeID
      });
    },
    exitQueue: function(){
      const dbRef = firebase.database().ref();
      const uid = firebase.auth().currentUser.uid;
      //Remove User from Queue
      this.currentUserRef.remove();
      this.isUserEnrolled = false;
      //Remove StoreID from SubscribedStoreID
      var subscribedStoreRef = dbRef.child("User/"+ uid + "/SubscribedStoreID");
      subscribedStoreRef.orderByChild("StoreID").equalTo(this.storeID).once("value",snapshot => {
        if(snapshot.exists()){
          var storeRef = snapshot.ref;
          storeRef.remove();
        }
      });
    },
    queueInc: function(snap){
      this.queueLength += snap.numChildren();
    },
    queueDec: function(snap){
      this.queueLength -= snap.numChildren();
      if(this.isUserEnrolled){
        var currentKey = this.currentUserRef.key;
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
    const dbRef = firebase.database().ref();
    dbRef.child('Queue').on("child_added", this.queueInc);
    dbRef.child('Queue').on("child_removed", this.queueDec);
  }
};
</script>
