<template>
  <div class="home">
    <h1>Welcome to the Home page</h1>
    <br>
    <h2>List of available stores:</h2>
    <ul>
      <li v-for="store in stores" :key="store.StoreId"><button @click="showQueue(store.StoreId)">{{store.StoreName}}</button></li>
    </ul>
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
      stores : []
    }
  },
  methods: {
    showQueue: function(StoreId){
      this.$router.replace("queue/" + StoreId);
    },
    logout: function() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.$router.replace("login");
        });
    },
    populateStores: function() {
      console.log(this.uid);
      var dbRef = firebase.database().ref();
      dbRef.child("Store").orderByChild("StoreName").once("value", snap => {
        var tempStores = [];
        snap.forEach(function(childSnap){
          tempStores.push({
            StoreId: childSnap.key,
            StoreName: childSnap.val().StoreName
          });
        });
        this.stores = tempStores;
        console.log(tempStores);
      });
    }
  },
  created() {
    this.populateStores();
  }
};
</script>
