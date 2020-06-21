<template>
  <div class="container has-text-centered">
    <div class="task-container is-mobile is-centered is-one-thirds">
      <h1 class="title is-3" style="margin:60px">Your Queues</h1>
      <div
        v-for="(store, index) of subscribedStores"
        :key="store.StoreId"
        :class="{ active: activeIndexSubscribed === index }"
        @mouseover="setActiveSubscribed(index)"
        @mouseout="setInactiveSubscribed"
        class="card results is-mobile"
        style="margin-bottom: 10px"
      >
        <div class="card-content">
          <div class="media is-vcentered">
            <div class="media-left">
              <p class="subtitle">Token</p>
              <p class="title is-centered is-2">{{ store.Token }}</p>
            </div>
            <div class="media-content is-centered" style="margin-right: 5px">
              <p class="title is-4">{{ store.StoreName }}</p>
              <div>
                <p class="subtitle is-7">
                  {{ store.Address }}
                </p>
              </div>
            </div>
            <div class="media-right columns is-vcentered">
              <div class="column">
                <button
                  class="button is-success is-small is-light"
                  @click="showQueue(store.StoreId)"
                >
                  Go to Queue
                </button>
              </div>
              <!-- If user's severity state is 0, displays Got Served button, else displays Leave Queue button -->
              <div v-if="store.State===0" class="column">
                <button
                  class="button is-link is-light is-centered is-small"
                  @click="leaveQueue(store.StoreId, index)"
                >
                  <span class="icon is-small">
                    <i class="fa fa-thumbs-up" aria-hidden="true"></i>
                  </span>
                  <span>Got Served</span>
                </button>
              </div>
              <div v-else class="column">
                <button
                  class="button is-danger is-small is-light"
                  @click="leaveQueue(store.StoreId, index)"
                >
                  Leave Queue
                </button>
              </div>
              <div class="column">
                <a
                  class="button is-link is-light is-centered is-small"
                  v-bind:href="
                    'https://www.google.com/maps/search/?api=1&query=<address>&query_place_id=' +
                      store.StoreId
                  "
                >
                  <span class="icon is-small">
                    <i class="fa fa-map-marker" aria-hidden="true"></i>
                  </span>
                  <span>Open in Map</span>
                </a>
              </div>
            </div>
          </div>
          <div class="content is-medium">
            <div>
              <p>Your turn will arrive at: {{ store.ExpectedTime }}<br /></p>
            </div>
            <div class="conditional-message">
              <!-- Conditional messages -->
              <div
                v-if="store.State === 0"
                class="button is-light is-static is-danger"
              >
                <p>You should be at the store now!<br /></p>
              </div>
              <div
                v-else-if="store.State === 1"
                class="button is-light is-static is-success"
              >
                <p>Sit back and relax!<br /></p>
              </div>
              <div
                v-else-if="store.State === 2"
                class="button is-light is-static is-warning"
              >
                <p>Get ready to leave<br /></p>
              </div>
              <div
                v-else-if="store.State === 3"
                class="button is-light is-static is-warning"
              >
                <p>You should start now!<br /></p>
              </div>
              <div v-else class="button is-light is-static is-info is-danger">
                <p>Hope you're on your way!<br /></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.active {
  border-radius: 16px;
  box-shadow: 0 0 10px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
</style>

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

    //remove user from queue 
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
      var subscribedStores = [];
      var promises = [];
      //Get SubscribedStoreIDs of user
      database_call
        .getSubscribedStoreID(this.uid)
        .then((subscribedStoreIds) => {
          subscribedStoreIds.forEach(function(subscribedStore) {
            promises.push(
              new Promise((resolve) => {
                var storeId = subscribedStore.val().StoreID;
                var storeKey = subscribedStore.key;

                // Retrieve the store object from db
                database_call.getStoreObject(storeId).then((storeObject) => {
                  var store = storeObject.val();

                  // Calculate waiting time for queue
                  var waitingTime = waiting_time.getWaitingTimeEnrolled(
                    store,
                    that.uid
                  );
                  var expectedTime = waiting_time.convertTimeToETA(waitingTime);

                  // Retrieve user info from db
                  database_call.getUserInfo(storeId, that.uid, function(user) {
                    var currentStore = {
                      StoreId: storeId,
                      StoreName: store.StoreName,
                      Address: store.Address,
                      WaitingTime: waitingTime,
                      ExpectedTime: expectedTime,
                      Token: user.tokenNumber,
                      UserKey: user.currentUserKey,
                      StoreKey: storeKey,
                      TravelTime: 10,
                    };
                    currentStore["State"] = that.getSeverityState(currentStore);
                    subscribedStores.push(currentStore);
                    resolve();
                  });
                });
              })
            );
          });
        });

      // sort the stores on severity once all stores are pushed to subscribedStores
      Promise.all(promises).then(() => {
        subscribedStores.sort(function(a, b) {
          // ascending order of severity
          return that.getSeverity(a) - that.getSeverity(b);
        });
        that.subscribedStores = subscribedStores;
      });
    },

    // returns the severity parameter for the store
    getSeverity: function(store) {
      var waitingTime = parseInt(store.WaitingTime);
      var travelTime = parseInt(store.TravelTime);
      return waitingTime - travelTime;
    },

    // returns the severity state to display conditional messages
    getSeverityState: function(store) {
      var severity = this.getSeverity(store);
      if (store.WaitingTime < 10) return 0;
      else if (severity > 30) return 1;
      else if (severity > 10) return 2;
      else if (severity > 0) return 3;
      else return 4;
    },
  },
  created() {
    this.populateStores();
  },
};
</script>
