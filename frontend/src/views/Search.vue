<template>
  <div class="search">
    <div class="container has-text-centered">
      <h1 class="title is-3">Store finder</h1>
      <h1 class="subtitle is-6 error-sign width-80" v-if="locationOn == false">
        {{ locationDisabledError }}
      </h1>
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
            :zoom="zoom"
            id="map"
            ref="map"
            @drag="updateCenter()"
            @zoom_changed="updateZoom($event)"
          >
            <!-- getStoreMarker fetches the blue/red markers for the active/inactive store markers. getUserMarker fetches the orange marker based on user location -->
            <span :key="index"
              v-for="(m, index) in markers">
            <gmap-custom-marker
              
              :marker="m.position"
            >
            <div class="marker">
              <div
                class="marker-top"
                @click="navigateToQueuePage(m.id)"
                @mouseover="setActive(index)"
                @mouseout="setInactive"
              >
                <center>
                  <b
                    ><p>{{ convertToHours(m.waitingTime) }}</p></b
                  >
                </center>
              </div>
              <div class="marker-bottom" :class="{ 'marker-bottom-active': activeIndex === index }"></div>
            </div> 
            </gmap-custom-marker>
            </span>
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
          :key="mark.id"
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
              <div class="media-content width-80">
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
  height: 350px;
  margin: 0 auto;
}

.borderless {
  border-color: white;
  padding: 0px;
}

.fixed-width-80 {
  width: 80%;
}

.marker-top {
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 5px;
  border-bottom: none;
  min-height: 20px;
  min-width: 20px;
  color: #fff;
  background-color: #3e628c;
}

.marker-top:hover {
  background: #e75480;
  min-height: 25px;
  min-width: 30px;
  border-radius: 8px;
  box-shadow: 0 0 10px 8px rgba(0, 0, 0, 0.1);
  transition: transform 330ms ease-in-out;
}

.marker-bottom {
  border: 5px solid transparent;
  border-top-color: #3e628c;
  height: 0;
  margin: 0 auto;
  width: 0;
}

.marker-bottom-active{
  border-top-color: #e75480;
}

</style>

<script>
import Vue from "vue";
import firebase from "firebase";
import axios from "axios";
import VueAxios from "vue-axios";
import GmapCustomMarker from "vue2-gmap-custom-marker";
import { waiting_time } from "../waitingtime";
import { maps_api } from "../mapsApi";
Vue.use(VueAxios, axios);

export default {
  name: "Search",
  components: {
    GmapCustomMarker,
  },
  data() {
    var center = { lat: 13.0166, lng: 77.6804 }; // Default center to Google Bangalore office :)
    var locationDisabledError = maps_api.getLocationDisabledError();

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
      locationOn: null,
      locationDisabledError: locationDisabledError,
      zoom: 14,
    };
  },

  mounted() {
    maps_api.getPosition().then((location) => {
      if (location) {
        this.center = location;
        this.markerCenter = location;
        this.locationOn = true;
      } else this.locationOn = false;
    });
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

    updateCenter() {
      this.markerCenter = {
        lat: this.$refs.map.$mapObject.getCenter().lat(),
        lng: this.$refs.map.$mapObject.getCenter().lng(),
      };

      if (this.searchItem != null) this.dragged = true;
    },

    updateZoom(event) {
      this.radius = Math.max(1000 * (18 - event),1000);
      console.log(this.radius);
      // console.log(this.$refs.map.$mapObject.getBounds());
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

    // autoCenter(){
    //   var bounds = this.$refs.map.$mapObject.getBounds();
    //   for(var i = 0; i < this.markers.length; i++)
    //     bounds.extend(this.markers[i].position);
      
    //   this.$refs.map.$mapObject.fitBounds(bounds);
    // },

    search: function() {
      let center = this.markerCenter;
      var queues = [];
      let promises = [];
      this.dragged = false;
      this.status = 1;
      this.markers = [];

      if (this.searchItem == null)
        // Does not make a request if query is empty
        return;

      // Parameters in the required format for Text Search API
      let placesParams = {
        location: this.markerCenter.lat + "," + this.markerCenter.lng,
        radius: this.radius,
        query: this.searchItem,
        key: process.env.VUE_APP_MAPS_API_KEY,
      };

      // Requests the Maps Places API (Text Search API) for list of nearby places
      axios
        .get(process.env.VUE_APP_PLACES_URL, { params: placesParams })
        .then((response) => {
          // Iterate over each store response from Places API
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
                      // Returns travel time between user and store location
                      return maps_api
                        .calculateTravelTime(localStore.place_id, center)
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

          // Wait for all promises to return and then sort the queue
          Promise.all(promises).then(() => {
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
            // this.autoCenter();
          });
        });
    },
  },
};
</script>
