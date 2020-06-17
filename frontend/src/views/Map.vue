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
          <a  v-for="(mark, index) in markers"
          :key="mark.location"
          :ref="`${mark.id}`"
          :class="{ active: activeIndex === index }"
          @mouseover="setActive(index)"
          @mouseout="setInactive" class="box" href="https://octoshrimpy.github.io/bulma-o-steps/">
    <!-- <div class="rows"> -->
          <div class="column">
            <h3 class="title is-4">
              <strong>{{ mark.location }}</strong>
            </h3>
            <h4 class="subtitle is-6">
              {{mark.time}}
            </h4>
          <!-- </div> -->
    </div>
      </a>
      </ul>
      <!-- <ul id="places"> -->
        <!-- Iterates over markers and obtains location names, activeIndex highlights the location of the marker being hovered on -->
        <!-- <li
          v-for="(mark, index) in markers"
          :key="mark.location"
          :ref="`${mark.id}`"
          :class="{ active: activeIndex === index }"
          @mouseover="setActive(index)"
          @mouseout="setInactive"
        >
          {{ mark.location }}, {{ mark.time }}
        </li> -->
      <!-- </ul> -->
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
    <button @click="logout">Logout</button>
    <br /><br />
    <p><router-link :to="{ name: 'Owner' }">For Owners</router-link></p>
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
  height: 700px;
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
import 'es6-promise/auto'

Vue.use(VueAxios, axios);

export default {
  name: "Map",
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
    logout: function() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.$router.replace("login");
        });
    },

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

      if (this.searchItem == null)
        // Does not make a request if query is empty
        return;

      let placesParams = {
        location: this.markerCenter.lat + "," + this.markerCenter.lng,
        radius: "1000",
        query: this.searchItem,
        key: process.env.VUE_APP_MAPS_API_KEY,
      };

      let promises = []
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
              dbRef
                .child("Store")
                .child(store.place_id)
                .child("queueOn")
                .once("value", function(snap) {
                  if (snap.val() == 1) {
                    // if queue is enabled at store, push it into the array of queues
                    let distanceParams = {
                      origins: center.lat + "," + center.lng,
                      destinations: "place_id:" + localStore.place_id,
                      departure_time: "now",
                      key: process.env.VUE_APP_DISTANCE_API_KEY,
                    };

                    promises.push(
                      axios
                        .get(process.env.VUE_APP_DISTANCE_URL, {
                          params: distanceParams,
                        })
                        .then((response) => {
                          queues.push({
                            location: localStore.name,
                            position: localStore.geometry.location,
                            id: localStore.place_id,
                            time: response.data.rows[0].elements[0].duration.text,
                          });
                        })
                    )
                  }
                });
            }
          }

        console.log(promises);
        Promise.allSettled(promises).then(response => {this.sortQueue(queues); console.log(response)})
        .catch(error => console.log(error)) 
      });
      // this.markers = queues; // Assign markers based on intersection of Maps API result & Firebase DB
    },

    sortQueue : function(queues){
      console.log("initial " + queues);
      for(var i = 0; i < queues.length; i++)
      {
        var small = i;
        for(var j = i; j < queues.length; j++)
        {
          if(queues[small].time > queues[j].time)
            small = j;
        }

        var temp = queues[i];
        queues[i] = queues[small];
        queues[small] = temp;
      }

      console.log("final " + queues);
      this.markers = queues;
    }
  },
};
</script>
