<template>
  <div class="Owner">
    <h1>Welcome to the Owner page</h1>
    <br><br>
    <h2>Shops you own:</h2>
    <ul>
      <li v-for="store in stores" :key="store.StoreId">
        {{store.StoreName}}
        <button @click="toggleQueue(store.StoreId, true)" v-if="!store.IsEnabled">Enable Queue</button>
        <button @click="toggleQueue(store.StoreId, false)" v-else>Disable Queue</button>
      </li>
    </ul>
    <p><router-link :to="{ name: 'Home' }">Back</router-link></p>
  </div>
</template>

<script>
import firebase from "firebase";
// @ is an alias to /src

export default {
  name: "Owner",
  components: {},
  data(){
    return{
      uid : null,
      stores: []
    }
  },
  methods: {
    toggleQueue: function(storeId, val){
      var storeRef = firebase.database().ref().child("Store/"+ storeId + "/IsEnabled");
      storeRef.set(val);
      var store = this.stores.find(store => store.StoreId==storeId);
      store.IsEnabled = val;
    },
    populateStores: function() {
      var dbRef = firebase.database().ref();
      this.uid = firebase.auth().currentUser.uid;
      var that = this;
      dbRef.child("User/" + this.uid + "/OwnedStoreID").once("value", snap => {
        let storeIds = [];
        snap.forEach(function(childSnap){
          storeIds.push(childSnap.val().StoreID);
        });
        storeIds.forEach(function(storeId){
          dbRef.child("Store/"+ storeId).once("value", snap => {
            that.stores.push({
              StoreId: snap.key,
              StoreName: snap.val().StoreName,
              IsEnabled: snap.val().IsEnabled
            });
          });
        });
      });
    }
  },
  created() {
    this.populateStores();
  }
};
</script>