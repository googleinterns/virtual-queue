<template>
  <div class="Queue">
    <h1>Welcome to the Queue page</h1>
    <br>
      <h2>Your UserID is : {{uid}}</h2>
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
  name: "Queue",
  components: {},
  data(){
    return{
      storeId: this.$route.params.StoreId,
      uid: null,
      currentUserRef: null,
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
      console.log(this.$route.params.StoreId);
      let dbRef = firebase.database().ref();
      this.uid = firebase.auth().currentUser.uid;
      dbRef.child("User/"+ this.uid + "/SubscribedStoreID").orderByChild("StoreID").equalTo(this.storeId).once("value",snapshot => {
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
      let dbRef = firebase.database().ref();
      dbRef.child("Store/"+this.storeId+"/UsersInQueue").once("value", snap => {
        var count = 0;
        snap.forEach(function(childSnap){
          if(this.uid==childSnap.val().userId){
            return true;
          }
          count++;
        });
        this.queuePosition = count;
      });
    },
    setCurrentUserRef: function() {
      let dbRef = firebase.database().ref();
      dbRef.child("Store/"+this.storeId+"/UsersInQueue").orderByChild("UserId").equalTo(this.uid).once("value",snapshot => {
        if (snapshot.exists()){
          this.currentUserRef = snapshot.ref;
        }
        else{
          console.log("Doesn't exist");
        }
      });
    },
    enterQueue: function() {
      let dbRef = firebase.database().ref();
      console.log(this.uid);
      //Enter User to Queue
      this.queuePosition = this.queueLength + 1;
      console.log("enter"+this.storeId);
      this.currentUserRef = dbRef.child("Store/"+this.storeId+"/UsersInQueue").push();
      this.currentUserRef.set({
        UserId : this.uid
      });
      this.isUserEnrolled = true;
      //Enter StoreID to SubscribedStoreID
      var storeRef = dbRef.child("User/"+ this.uid + "/SubscribedStoreID").push();
      storeRef.set({
        StoreID : this.storeId
      });
    },
    exitQueue: function(){
      let dbRef = firebase.database().ref();
      //Remove User from Queue
      this.currentUserRef.remove();
      this.isUserEnrolled = false;
      //Remove StoreID from SubscribedStoreID
      var subscribedStoreRef = dbRef.child("User/"+ this.uid + "/SubscribedStoreID");
      subscribedStoreRef.orderByChild("StoreID").equalTo(this.storeId).once("value",snapshot => {
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
    let dbRef = firebase.database().ref();
    dbRef.child("Store/"+this.storeId+"/UsersInQueue").on("child_added", this.queueInc);
    dbRef.child("Store/"+this.storeId+"/UsersInQueue").on("child_removed", this.queueDec);
  }
};
</script>
