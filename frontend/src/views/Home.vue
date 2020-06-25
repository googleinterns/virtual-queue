<template>
  <div class="container has-text-centered">
    <div class="task-container is-mobile is-centered is-one-thirds">
      <h1 class="title is-3">Your Queues</h1>
      <h1 class="subtitle is-6 error-sign width-80" v-if="locationOn == false">
        {{ locationDisabledError }}
      </h1>
      <div
        v-for="(store, index) of subscribedStores"
        :key="store.StoreId"
        :class="{ active: activeIndexSubscribed === index }"
        @mouseover="setActiveSubscribed(index)"
        @mouseout="setInactiveSubscribed"
        class="card results is-mobile"
        style="margin-bottom: 10px"
      >
        <div>
          <p
            class="subtitle is-6"
            style="color: #257942"
            v-if="!store.IsLeaveQueueEnabled"
          >
            You have been served! <br />
            Thank you for using our service
          </p>
        </div>
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
              <div v-if="store.State === 0" class="column">
                <button
                  class="button is-link is-light is-centered is-small"
                  :disabled="!store.IsLeaveQueueEnabled"
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
                  :disabled="!store.IsLeaveQueueEnabled"
                  @click="leaveQueue(store.StoreId, index)"
                >
                  Leave Queue
                </button>
              </div>
              <div class="column">
                <a
                  class="button is-link is-light is-centered is-small"
                  v-bind:href="mapURL + store.StoreId"
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
              <p class="subtitle is-6">
                Turn will arrive in slot:
                <b>
                  {{ store.ExpectedTimeBegin }} - {{ store.ExpectedTimeEnd }}
                </b>
                <br />
              </p>
            </div>
            <!-- Displaying leave time only is location is switched on, if it is in the future and if it is before the wait time window's beginning-->
            <div v-if="locationOn && store.WaitingTime - store.TravelTime > 0 && store.LeaveTime<store.ExpectedTimeBegin">
              <p class="subtitle is-6">
                Leave for the store by <b>{{ store.LeaveTime }}</b>
              </p>
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
                v-else-if="store.State === 4"
                class="button is-light is-static is-success"
              >
                <p>Sit back and relax!<br /></p>
              </div>
              <div
                v-else-if="store.State === 3"
                class="button is-light is-static is-warning"
              >
                <p>Get ready to leave<br /></p>
              </div>
              <div
                v-else-if="store.State === 2"
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
  box-shadow: 30px 30px 30px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
</style>

<script>
import { database_call } from "../database.js";
import { waiting_time } from "../waitingtime.js";
import { maps_api } from "../mapsApi";
import moment from "moment";

export default {
  name: "Home",
  components: {},
  data() {
    return {
      uid: null,
      ownedStores: [],
      subscribedStores: [],
      userLocation: null,
      locationOn: null,
      activeIndexSubscribed: null,
      locationDisabledError: maps_api.getLocationDisabledError(),
      mapURL:
        "https://www.google.com/maps/search/?api=1&query=<address>&query_place_id=",
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

    // remove user from queue
    leaveQueue: function(storeId, key) {
      // disable leave queue button
      var store = this.subscribedStores.find(
        (store) => store.StoreId == storeId
      );
      store.IsLeaveQueueEnabled = false;

      var storeKey = this.subscribedStores[key].StoreKey;
      var userKey = this.subscribedStores[key].UserKey;

      // remove user from queue - db call
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
      // Get SubscribedStoreIDs of user
      database_call
        .getSubscribedStoreID(this.uid)
        .then((subscribedStoreIds) => {
          subscribedStoreIds.forEach(function(subscribedStore) {
            var storeId = subscribedStore.val().StoreID;
            var storeKey = subscribedStore.key;

            // Retrieve the store object from db
            promises.push(
              database_call.getStoreObject(storeId).then((storeObject) => {
                var store = storeObject.val();

                // Calculate waiting time for queue
                var waitingTime = waiting_time.getWaitingTimeEnrolled(
                  store,
                  that.uid
                );
                var expectedTime = waiting_time.convertTimeToETA(waitingTime);
                var expectedTimeBegin = moment()
                  .add(waitingTime, "minutes")
                  .subtract(7.5, "minutes")
                  .format("LT");
                var expectedTimeEnd = moment()
                  .add(waitingTime, "minutes")
                  .add(7.5, "minutes")
                  .format("LT");

                // Retrieve user info from db
                return database_call
                  .getUserInfoAsync(storeId, that.uid)
                  .then((user) => {
                    var currentStore = {
                      StoreId: storeId,
                      StoreName: store.StoreName,
                      Address: store.Address,
                      WaitingTime: waitingTime,
                      ExpectedTime: expectedTime,
                      Token: user.tokenNumber,
                      UserKey: user.currentUserKey,
                      StoreKey: storeKey,
                      TravelTime: 0,
                      IsLeaveQueueEnabled: true,
                      ExpectedTimeBegin: expectedTimeBegin,
                      ExpectedTimeEnd: expectedTimeEnd,
                    };

                    // Get the travel time to store if location is enabled
                    if (that.locationOn) {
                      return maps_api
                        .calculateTravelTime(storeId, that.userLocation)
                        .then((travelTime) => {
                          var travelTimeSeconds = parseInt(
                            travelTime.data.rows[0].elements[0].duration.value
                          );
                          currentStore["TravelTime"] = Math.floor(
                            travelTimeSeconds / 60
                          );

                          // Leave Time is time at which user should leave for the store
                          // Calculated by current time + waiting time - travel time
                          currentStore["LeaveTime"] = moment()
                            .add(waitingTime, "minutes")
                            .subtract(travelTimeSeconds, "seconds")
                            .format("LT");
                          currentStore["State"] = that.getSeverityState(
                            currentStore
                          );
                          console.log("LeaveTime");
                          console.log(currentStore["LeaveTime"]);
                          console.log(currentStore["ExpectedTimeBegin"]);
                          subscribedStores.push(currentStore);
                        });
                    } else {
                      currentStore["State"] = that.getSeverityState(
                        currentStore
                      );
                      subscribedStores.push(currentStore);
                    }
                  });
              })
            );
          });
          // sort the stores on severity once all stores are pushed to subscribedStores
          Promise.all(promises).then(() => {
            subscribedStores.sort(function(a, b) {
              // ascending order of severity
              return that.getSeverityState(a) - that.getSeverityState(b);
            });
            that.subscribedStores = subscribedStores;
          });
        });
    },

    // returns the severity state to display conditional messages
    getSeverityState: function(store) {
      var waitingTime = parseInt(store.WaitingTime);
      var travelTime = parseInt(store.TravelTime);
      console.log(travelTime);

      // severity is beginning of expected time window - time to travel
      var waitWindowStart = waitingTime - 7.5;
      var severity = waitWindowStart - travelTime;

      // Message: You should be at the store now! (waitTime < 10 min)
      if (store.WaitingTime < 10) return 0;
      // Message: Sit back and relax! (waitTime - travelTime > 30 min)
      else if (severity > 30) return 4;
      // Message: Get ready to leave (30 min > waitTime - travelTime > 10 min)
      else if (severity > 10) return 3;
      // Message: You should start now! (10 min > waitTime - travelTime > 0 min)
      else if (severity > 0) return 2;
      // Message: Hope you're on your way! (waitTime - travelTime < 0 min)
      else return 1;
    },
  },
  created() {
    this.populateStores();
  },
  mounted() {
    maps_api.getPosition().then((location) => {
      if (location) {
        this.userLocation = location;
        this.locationOn = true;
      } else this.locationOn = false;
    });
  },
};
</script>
