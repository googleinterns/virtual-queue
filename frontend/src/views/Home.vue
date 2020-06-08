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
    enterQueue: function() {
      const queueRef = firebase.database().ref().child('Queue');
      this.queuePosition = this.queueLength + 1;
      this.currentUserRef = queueRef.push();
      this.currentUserRef.set({
        userId : firebase.auth().currentUser.uid
      });
      this.isUserEnrolled = true;
    },
    exitQueue: function(){
      this.currentUserRef.remove();
      this.isUserEnrolled = false;
    },
    queueInit: function(snap){
      this.queueLength = snap.numChildren();
      console.log(snap.numChildren());
    },
    queueInc: function(snap){
      this.queueLength += snap.numChildren();
      console.log(snap.numChildren());
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
            console.log("entered"+childSnap.key);
            if(currentKey>childSnap.key){
              this.queuePosition--;
            }
          });
        }
      }
    }
  },
  mounted() {
    //Listening to changes in the queue
    const queueRef = firebase.database().ref().child('Queue');
    //queueRef.once("value", this.queueInit);
    queueRef.on("child_added", this.queueInc);
    queueRef.on("child_removed", this.queueDec);
  }
};
</script>
