<template>
  <div class="Owner">
    <h1>Welcome to the Owner page</h1>
    <br /><br />
    <h2>Shops you own:</h2>
    <ul>
      <li v-for="store in stores" :key="store.StoreId">
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
    <p><router-link :to="{ name: 'Maps' }">Back</router-link></p>
  </div>
</template>

<script>
import { database_call } from "../database.js";

export default {
  name: "Owner",
  components: {},
  data() {
    return {
      uid: null,
      stores: [],
    };
  },
  methods: {
    // set IsEnabled of store to toggle
    toggleQueue: function(storeId, toggle) {
      var that = this;
      // change IsEnabled in the database
      database_call.toggleQueue(storeId, toggle, function() {
        var store = that.stores.find((store) => store.StoreId == storeId);
        // change local value of IsEnabled
        store.IsEnabled = toggle;
      });
    },

    // populate stores[] with store info of stores owned by user
    populateStores: function() {
      this.uid = database_call.getUserId();
      var that = this;
      database_call.getOwnedStoreID(this.uid, function(storeIds) {
        storeIds.forEach(function(storeId) {
          database_call.getStoreInfo(storeId, function(storeName, isEnabled) {
            that.stores.push({
              StoreId: storeId,
              StoreName: storeName,
              IsEnabled: isEnabled,
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
