<template>
  <div class="Home">
    <h1>Welcome to the Home page</h1>
    <br /><br />
    <div class="OwnedStores">
      <h2>Shops you own:</h2>
      <ul>
        <li v-for="store in ownedStores" :key="store.StoreId">
          {{ store.StoreName }}
          <button
            @click="toggleQueue(store.StoreId, true)"
            v-if="!store.IsEnabled"
          >
            Enable Queue
          </button>
          <button @click="toggleQueue(store.StoreId, false)" v-else>
            Disable Queue
          </button>
        </li>
      </ul>
    </div>
    <br /><br />
    <div class="SubscribedStores">
      <h2>Shops you are enrolled in:</h2>
      <ul>
        <li v-for="store in subscribedStores" :key="store.StoreId">
          {{ store.StoreName }}
          <button @click="showQueue(store.StoreId)">
            Go to queue
          </button>
        </li>
      </ul>
    </div>
    <p><router-link :to="{ name: 'Search' }">Back</router-link></p>
  </div>
</template>

<script>
import { database_call } from "../database.js";

export default {
  name: "Home",
  components: {},
  data() {
    return {
      ownedStores: [],
      subscribedStores: [],
    };
  },
  methods: {
    // routes to Queue page of store with storeId
    showQueue: function(storeId) {
      this.$router.replace("queue/" + storeId);
    },

    // set IsEnabled of store to toggle
    toggleQueue: function(storeId, toggle) {
      var that = this;
      // change IsEnabled in the database
      database_call.toggleQueue(storeId, toggle, function() {
        var store = that.ownedStores.find((store) => store.StoreId == storeId);
        // change local value of IsEnabled
        store.IsEnabled = toggle;
      });
    },

    // populate ownedStores[] with store info of stores owned by user and subscribedStores[]
    populateStores: function() {
      this.uid = database_call.getUserId();
      var that = this;
      database_call.getOwnedStoreID(this.uid, function(storeIds) {
        storeIds.forEach(function(storeId) {
          database_call.getStoreInfo(storeId, function(store) {
            that.ownedStores.push({
              StoreId: storeId,
              StoreName: store.StoreName,
              IsEnabled: store.IsEnabled,
            });
          });
        });
      });
      database_call.getSubscribedStoreID(this.uid, function(storeIds) {
        storeIds.forEach(function(storeId) {
          database_call.getStoreInfo(storeId, function(store) {
            that.subscribedStores.push({
              StoreId: storeId,
              StoreName: store.StoreName,
            });
          });
        });
      });
    },
  },
  created() {
    this.populateStores();
  },
};
</script>
