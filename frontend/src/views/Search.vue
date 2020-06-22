<template>
  <div class="search">
    <div class="container has-text-centered">
      <h1 class="title is-3">Store finder</h1>
      <div class="columns is-gapless is-mobile is-centered">
        <div class="field is-grouped">
          <form class="control has-icons-right" @submit="search">
            <input
              class="input is-rounded"
              type="text"
              v-model="searchItem"
              style="border-width:2px;"
              Placeholder="Grocery stores"
            />
            <div v-on:click="search">
              <span class="icon is-medium is-right">
                <i class="fa fa-search" style="color: black"></i>
              </span>
            </div>
          </form>
        </div>
      </div>
      <div class="columns is-gapless is-mobile is-centered">
        <!-- Renders a map and iterates over markers to place them on the basis of lat and lng, setActive function used to highlight location on hover -->
        <div class="column is-11">
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
      <div class="column" v-if="status === 1">
        <button class="button is-loading borderless">Loading</button>
        <div>Loading</div>
      </div>
      <div v-if="status === -1">
        No shops found near you!
        <i class="fa fa-frown" aria-hidden="true"></i>
      </div>
      <button
        class="button is-info is-rounded is-outlined"
        @click="search"
        v-if="dragged"
      >
        Search this location!
      </button>

      <div class="task-container column is-mobile is-centered is-one-thirds">
        <div
          v-for="(mark, index) in markers"
          :key="mark.location"
          :ref="`${mark.id}`"
          :class="{ active: activeIndex === index }"
          @mouseover="setActive(index)"
          @mouseout="setInactive"
          class="card results"
          style="margin-bottom: 5px"
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
              <div class="media-content fixed-width-80">
                <p class="title is-6 is-left">{{ mark.location }}</p>
                <p class="subtitle is-6">
                  Wait: {{ convertToHours(mark.waitingTime) }} <br />
                  Travel: {{ mark.travelTime }} mins
                </p>
              </div>
              <div class="media-right column is-vcentered">
                <button
                  class="button is-link is-small is-light"
                  @click="navigateToQueuePage(mark.id)"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results {
  max-width: 450px;
  margin: 0 auto;
}
.active {
  border-radius: 16px;
  box-shadow: 0 0 10px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

#map {
  height: 200px;
  margin: 0 auto;
}

.borderless {
  border-color: white;
  padding: 0px;
}


.fixed-width-80{
  width: 80%;
}
</style>

<script>
import Vue from "vue";
import firebase from "firebase";
import axios from "axios";
import VueAxios from "vue-axios";
import { waiting_time } from "../waitingtime";
import { search_api } from "../searchApi"
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
      dragged: false,
      status: null,
    };
  },

  mounted() {
    search_api.geolocate(this);
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

      if (this.searchItem != null) this.dragged = true;
    },

    navigateToQueuePage(id) {
      this.$router.replace("queue/" + id);
    },

    setPlace(place) {
      this.currentPlace = place;
    },

    convertToHours(num) {
      return waiting_time.convertToHours(num);
    },

    search: function() {
      // let center = this.markerCenter;
      var queues = [];
      let promises = [];
      this.dragged = false;
      this.status = 1;
      this.markers = [];
      var that = this;

      if (this.searchItem == null)
        // Does not make a request if query is empty
        return;

      let placesParams = {
        location: this.markerCenter.lat + "," + this.markerCenter.lng,
        radius: "1000",
        query: this.searchItem,
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
            // check if a store with obtained location ID exists in firebase DB
            if (locref) {
              let localStore = store;
              promises.push(
                dbRef
                  .child("Store")
                  .child(store.place_id)
                  .child("IsEnabled")
                  .once("value")
                  .then(function(snap) {
                    if (snap.val()) {
                      search_api.calculateTravelTime(localStore.place_id, that.$userLocation)
                        .then((response) => {
                          let imgVal =
                            "https://maps.gstatic.com/tactile/pane/default_geocode-2x.png";
                          // Checks if location has an associated photo and assigns it accordingly. If not, uses default image.
                          if (localStore.photos)
                            imgVal =
                              process.env.VUE_APP_PHOTO_URL +
                              localStore.photos[0].photo_reference +
                              "&key=" +
                              process.env.VUE_APP_MAPS_API_KEY +
                              "&maxwidth=90";

                          // Obtains waiting time based on queue length
                          return waiting_time
                            .getWaitingTimeAsync(localStore.place_id)
                            .then((waitingTime) => {
                              queues.push({
                                location: localStore.name,
                                position: localStore.geometry.location,
                                id: localStore.place_id,
                                // Stores the numerical value of travel time by splitting and parsing the string returned by Maps API
                                travelTime: parseInt(
                                  response.data.rows[0].elements[0].duration.text.split(
                                    " "
                                  )
                                ),
                                waitingTime: waitingTime,
                                img: imgVal,
                              });
                            });
                        });
                    }
                  })
              );
            }
          }
          Promise.all(promises).then(() => {
            // Wait for all promises to return and then sort the queue
            if (queues.length == 0) this.status = -1;
            else this.status = 0;

            queues.sort(function(a, b) {
              // User serve time is calculated as the maximum value between travel / waiting time as that is the time estimate for when the user's turn will come
              var aTime = Math.max(a.travelTime, a.waitingTime);
              var bTime = Math.max(b.travelTime, b.waitingTime);
              // Sort in ascending order of time
              return aTime - bTime;
            });
            this.markers = queues;
          });
        });
    },
  },
};
</script>
