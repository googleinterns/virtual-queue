<template>
  <div class="container has-text-centered">
    <h1 class="title is-2">Store finder</h1>
    <div class="columns is-gapless is-mobile is-centered">
      <div class="field is-grouped search">
        <p class="control">
          <input
            class="input"
            type="text"
            placeholder="Grocery stores nearby"
            v-model="searchItem"
          />
        </p>
        <button v-on:click="search" class="button is-info">
          Search
        </button>
      </div>
    </div>
    <div class="column">
      <!-- Renders a map and iterates over markers to place them on the basis of lat and lng, setActive function used to highlight location on hover -->
      <div class="column is-two-thirds">
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

    <div class="column is-one-thirds">
      <div v-for="(mark, index) in markers"
          :key="mark.location"
          :ref="`${mark.id}`"
          :class="{ active: activeIndex === index }"
          @mouseover="setActive(index)"
          @mouseout="setInactive"
          class="card" style="margin-bottom: 5px"
        >
        <div class="card-content">
          <div class="media">
            <div class="media-left">
              <figure class="image">
                <img
                  :src="`${mark.img}`"
                  alt="Placeholder image"
                  style="width:70px; height: 70px;"
                />
              </figure>
            </div>
            <div class="media-center">
              <div class="level-left">
                <div class="level-item">
                  <p class="title is-6 is-left">{{mark.location}}</p>
                </div>
                <div class="level-item">
                  <p class="subtitle is-6">
                    Wait: 10 min <br />
                    Travel: {{mark.time}}
                  </p>
                </div>
              </div>
            </div>
            <div class="media-right column is-vcentered">
              <button class="button is-info">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active {
  background-color: #3298dc;
}

#map {
  height: 200px;
}

div.sticky {
  position: -webkit-sticky; /* Safari */
  position: sticky;
  top: 0;
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
                          img: "https://maps.googleapis.com/maps/api/place/photo?photoreference="+localStore.photos[0].photo_reference+"&key=AIzaSyB5zdJrg17CL2W9wxiXsLvAdoztzhxMdPo&maxwidth=90",
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
