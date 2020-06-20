<template>
  <div class="container has-text-centered">
    <!-- <div class="OwnedStores">
      <h2>Shops you own:</h2>
      <ul>
        <li v-for="store of ownedStores" :key="store.StoreId">
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
    </div> -->
    <div class="task-container is-mobile is-centered is-one-thirds">
      <h1 class="title">Your Queues</h1>
      <div
        v-for="(store, index) of subscribedStores"
        :key="store.StoreId"
        :class="{ active: activeIndexSubscribed === index }"
        @mouseover="setActiveSubscribed(index)"
        @mouseout="setInactiveSubscribed"
        class="card results"
        style="margin-bottom: 10px"
      >
        <div class="card-content">
          <div class="media">
            <div class="media-left">
              <p class="subtitle">Token</p>
              <p class="title is-centered">{{ store.Token }}</p>
            </div>
            <div class="media-content is-centered">
              <p class="title is-5">{{ store.StoreName }}</p>
              <p class="content is-small ">{{ store.Address }}</p>
              <p class="content is-medium">
                Your turn will arrive at: {{ store.ExpectedTime }}
              </p>
            </div>
            <div class="media-right columns">
              <div class="column">
                <button
                  class="button is-success is-small is-light"
                  @click="showQueue(store.StoreId)"
                >
                  Go to Queue
                </button>
              </div>
              <div class="column">
                <button
                  class="button is-danger is-small is-light"
                  @click="leaveQueue(store.StoreId, index)"
                >
                  Leave Queue
                </button>
              </div>
              <div class="column">
                <a
                  class="button is-link is-small is-light"
                  v-bind:href="
                    'https://www.google.com/maps/search/?api=1&query=<address>&query_place_id=' +
                      store.StoreId
                  "
                >
                  Open in Map
                </a>
              </div>
            </div>
          </div>
          <!-- <div class="content is-medium">
            <p>Your turn will arrive at: {{ store.ExpectedTime }}</p>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { database_call } from "../database.js";
import { waiting_time } from "../waitingtime.js";

export default {
  name: "Home",
  components: {},
  data() {
    return {
      uid: null,
      ownedStores: [],
      subscribedStores: [],
      activeIndexSubscribed: null,
    };
  },
  methods: {
    setActiveSubscribed: function(storeId) {
      this.activeIndexSubscribed = storeId;
    },

    setInactiveSubscribed: function() {
      this.activeIndexSubscribed = null;
    },

    // routes to Queue page of store with storeId
    showQueue: function(storeId) {
      this.$router.replace("queue/" + storeId);
    },

    leaveQueue: function(storeId, key) {
      var storeKey = this.subscribedStores[key].StoreKey;
      var userKey = this.subscribedStores[key].UserKey;

      // delete from stores
      delete this.subscribedStores[key];
      console.log(this.subscribedStores);

      //remove user from queue
      database_call.removeFromQueue(
        storeId,
        this.uid,
        storeKey,
        userKey,
        function(error) {
          console.log(error);
        }
      );
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
      database_call.getSubscribedStoreID(this.uid, function(
        subscribedStoreIds
      ) {
        subscribedStoreIds.forEach(function(subscribedStore) {
          database_call.getStoreObject(subscribedStore.StoreID, function(
            storeObject
          ) {
            waiting_time.getExpectedTimeEnrolledStore(
              storeObject,
              that.uid,
              function(expectedTime) {
                database_call.getUserInfo(
                  subscribedStore.StoreID,
                  that.uid,
                  function(user) {
                    that.subscribedStores.push({
                      StoreId: subscribedStore.StoreID,
                      StoreName: storeObject.StoreName,
                      Address: storeObject.Address,
                      ExpectedTime: expectedTime,
                      Token: user.tokenNumber,
                      UserKey: user.currentUserKey,
                      StoreKey: subscribedStore.StoreKey,
                      TravelTime: 10,
                    });
                  }
                );
              }
            );
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
