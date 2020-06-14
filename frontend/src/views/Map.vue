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
          {{ mark.location }}
        </li>
      </ul>
      <!-- Renders a map and iterates over markers to place them on the basis of lat and lng, setActive function used to highlight location on hover -->
      <gmap-map :center="center" :zoom="10" id="map">
        <gmap-marker
          :key="index"
          v-for="(m, index) in markers"
          :position="m.position"
          @click="navigateToQueuePage(m.id)"
          :icon="getMarker(index)"
          @mouseover="setActive(index)"
          @mouseout="setInactive"
        ></gmap-marker>
        <gmap-info-window 
          v-for="(m,index) in markers"
          :position="m.position"
          :key="m.id"
            :opened="activeIndex === index" 
            :options="{
              pixelOffset: {
                width: 0,
                height: -35
              }
            }"
            >
             {{m.location}}
        </gmap-info-window>
      </gmap-map>
    </div>
    <button @click="logout">Logout</button>
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
  name: "Map",
  data() {
    var center = { lat: 13.0166, lng: 77.6804 }; // Default center to Google Bangalore office :)
    return {
      center: center,
      markers: [],
      activeIndex: undefined,
      places: [],
      currentPlace: null,
      searchItem: null,
      info_marker: null,
      infowindow: {lat: 10, lng: 10.0},
      window_open: false
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

    setActive(index){
      this.activeIndex = index;
      this.window_open = true;
    },

    setInactive() {
      this.activeIndex = undefined;
    },

    getMarker(index){
      if(this.activeIndex == index)
        return {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: {width: 40, height: 40},
        }
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
      });
    },

    search: function() {
      var queues = [];

      if (this.searchItem == null)
        // Does not make a request if query is empty
        return;

      const parameters = {
        location: this.center.lat + "," + this.center.lng,
        radius: "1000",
        name: this.searchItem,
        key: process.env.VUE_APP_MAPS_API_KEY,
      };

      axios
        .get(process.env.VUE_APP_MAPS_URL, { params: parameters })
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
                    queues.push({
                      location: localStore.name,
                      position: {
                        lat: localStore.geometry.location.lat,
                        lng: localStore.geometry.location.lng,
                      },
                      id: localStore.place_id,
                    });
                  }
                });
            }
          }
        });
      this.markers = queues; // Assign markers based on intersection of Maps API result & Firebase DB
    },
  },
};
</script>
