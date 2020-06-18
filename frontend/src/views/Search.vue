<template>
  <div>
    <h1 class="title is-2">Search for your favourite stores!</h1>
    <div>
      <label>
        <div class="field is-grouped search">
          <p class="control is-expanded">
            <input
              class="input"
              type="text"
              placeholder="Pizza places"
              v-model="searchItem"
            />
          </p>
          <button v-on:click="search">
            Search
          </button>
        </div>
      </label>
      <br />
    </div>
    <br />
    <div id="wrapper" class="content">
      <ul id="places">
        <!-- Iterates over markers and obtains location names, activeIndex highlights the location of the marker being hovered on -->
        <li
          v-for="(mark, index) in markers"
          :key="mark.location"
          :ref="`${mark.id}`"
          :class="{ active: activeIndex === index }"
          @mouseover="setActive(index)"
          @mouseout="setInactive"
        >
          {{ mark.location }}, {{ mark.time }}
        </li>
      </ul>
      <!-- Renders a map and iterates over markers to place them on the basis of lat and lng, setActive function used to highlight location on hover -->
      <gmap-map
        :center="center"
        :zoom="10"
        id="map"
        ref="map"
        @center_changed="updateCenter($event)"
      >
        <!-- getStoreMarker fetches the blue/red markers for the active/inactive store markers. getUserMarker fetches the orange marker based on user location -->
        <gmap-marker
          :key="index"
          v-for="(m, index) in markers"
          :position="m.position"
          @click="navigateToQueuePage(m.id)"
          :icon="getStoreMarker(index)"
          @mouseover="setActive(index)"
          @mouseout="setInactive"
        ></gmap-marker>
        <gmap-marker
          :position="markerCenter"
          :icon="getUserMarker()"
        ></gmap-marker>
        <gmap-info-window
          v-for="(m, index) in markers"
          :position="m.position"
          :key="m.id"
          :opened="activeIndex === index"
          :options="{
            pixelOffset: {
              width: 0,
              height: -35,
            },
          }"
        >
          {{ m.location }}
        </gmap-info-window>
      </gmap-map>
    </div>
  </div>
</template>

<style scoped>
#wrapper {
  width: 80%;
  display: flex;
  justify-content: center;
  margin: 0 auto;
}

#places,
#map {
  margin: 2%;
}

#map {
  width: 70%;
  height: 500px;
}

.active {
  background-color: #3298dc;
}

li {
  font-size: 25px;
}

.search {
  width: 40%;
  margin: 0 auto;
}
</style>

<script>
import Vue from "vue";
import firebase from "firebase";
import axios from "axios";
import VueAxios from "vue-axios";
Vue.use(VueAxios, axios);

export default {
  name: "Search",
  data() {
    var center = { lat: 13.0166, lng: 77.6804 }; // Default center to Google Bangalore office :)
    return {
      center: center,
      markerCenter: center,
      markers: [],
      activeIndex: undefined,
      places: [],
      currentPlace: null,
      searchItem: null,
      windowOpen: false,
    };
  },

  mounted() {
    this.geolocate();
  },

  methods: {
    setActive(index) {
      this.activeIndex = index;
      this.windowOpen = true;
    },

    setInactive() {
      this.activeIndex = undefined;
    },

    getStoreMarker(index) {
      if (this.activeIndex == index)
        return {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: { width: 40, height: 40 },
        };
    },

    getUserMarker() {
      return {
        url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
        scaledSize: { width: 40, height: 40 },
      };
    },

    updateCenter(event) {
      this.markerCenter = {
        lat: event.lat(),
        lng: event.lng(),
      };
    },

    navigateToQueuePage(id) {
      this.$router.replace("queue/" + id);
    },

    setPlace(place) {
      this.currentPlace = place;
    },

    geolocate: function() {
      // Gets user's location and centers the map around that
      navigator.geolocation.getCurrentPosition((position) => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        this.markerCenter = this.center;
      });
    },

    search: function() {
      let center = this.markerCenter;
      var queues = [];
      let promises = [];

      if (this.searchItem == null)
        // Does not make a request if query is empty
        return;

      let placesParams = {
        location: this.markerCenter.lat + "," + this.markerCenter.lng,
        radius: "1000",
        name: this.searchItem,
        key: process.env.VUE_APP_MAPS_API_KEY,
      };

      axios
        .get(process.env.VUE_APP_PLACES_URL, { params: placesParams })
        .then((response) => {
          console.log(response);
          for (var i = 0; i < response.data.results.length; i++) {
            var store = response.data.results[i];
            let dbRef = firebase.database().ref();
            var locref = dbRef.child("Store").child(store.place_id);
            if (locref) {
              // check if a store with the location ID exists in firebase DB
              let localStore = store;
              promises.push(
                dbRef
                  .child("Store")
                  .child(store.place_id)
                  .child("queueOn")
                  .once("value")
                  .then(function(snap) {
                    if (snap.val() == 1) {
                      // if queue is enabled at store, push it into the array of queues
                      let distanceParams = {
                        origins: center.lat + "," + center.lng,
                        destinations: "place_id:" + localStore.place_id,
                        departure_time: "now",
                        key: process.env.VUE_APP_DISTANCE_API_KEY,
                      };

                      return axios
                        .get(process.env.VUE_APP_DISTANCE_URL, {
                          params: distanceParams,
                        })
                        .then((response) => {
                          // Obtains the travel time from the user's location
                          queues.push({
                            location: localStore.name,
                            position: localStore.geometry.location,
                            id: localStore.place_id,
                            time:
                              response.data.rows[0].elements[0].duration.text,
                          });
                        });
                    }
                  })
              );
            }
          }
          Promise.all(promises).then(() => {
            // Wait for all promises to return and then sort the queue
            queues.sort(function(a, b) {
              // Split the string to obtain the numerical value of time
              var aTime = parseInt(a.time.split(" "));
              var bTime = parseInt(b.time.split(" "));
              // Sort in ascending order
              return aTime - bTime;
            });
            // Assign markers based on intersection of Maps API result & Firebase DB
            this.markers = queues;
          });
        });
    },
  },
};
</script>
