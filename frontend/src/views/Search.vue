<template>
  <div class="search">
    <div class="container has-text-centered">
      <h1 class="title is-3">Store finder</h1>
      <!-- Displays an error if location is disabled -->
      <h1 class="subtitle is-6 error-sign width-80" v-if="locationOn == false">
        {{ locationDisabledError }}
      </h1>
      <div class="columns is-gapless is-mobile is-centered">
        <div class="field is-grouped">
          <form class="control has-icons-right" @submit="search">
            <input
              class="input is-rounded border-2"
              type="text"
              v-model="searchItem"
              Placeholder="Grocery stores"
            />
            <div v-on:click="search">
              <span class="icon is-medium is-right">
                <i class="fa fa-search color-black"></i>
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
            @drag="updateMarkerCenter()"
            @zoom_changed="updateRadius($event)"
          >
            <span :key="index" v-for="(m, index) in markers">
              <gmap-custom-marker :marker="m.position">
                <div class="marker">
                  <div
                    class="marker-top"
                    :class="{ 'marker-top-active': activeIndex === index }"
                    @click="setActive(index)"
                  >
                    <center>
                      <b
                        ><p>{{ convertToHours(m.waitingTime) }}</p></b
                      >
                    </center>
                  </div>
                  <div
                    class="marker-bottom"
                    :class="{ 'marker-bottom-active': activeIndex === index }"
                  ></div>
                </div>
              </gmap-custom-marker>
            </span>
            <gmap-marker :position="markerCenter"></gmap-marker>
            <!-- Info windows corresponding to each location that get activated on hover of marker -->
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
      <!-- Displays a search button if the map has been dragged (or central marker position changed) since last query -->
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
        >
          <div class="card-content">
            <div class="media">
              <div class="media-left">
                <figure class="image">
                  <img
                    v-lazy="`${mark.img}`"
                    alt="Placeholder image"
                    class="shop-image"
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
  margin-bottom: 5px;
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

.shop-image {
  width: 70px;
  height: 70px;
}

.borderless {
  border-color: white;
  padding: 0px;
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

/* Change marker colour on click and size/border transitions */
.marker-top-active {
  background-color: #e75480 !important;
  min-height: 5px;
  min-width: 10px;
  border-radius: 8px;
  box-shadow: 0 0 10px 8px rgba(0, 0, 0, 0.1);
  transition: transform 330ms ease-in-out;
}

/* Styles the marker with an arrow at the bottom */
.marker-bottom {
  border: 5px solid transparent;
  border-top-color: #3e628c;
  height: 0;
  margin: 0 auto;
  width: 0;
}

.marker-bottom-active {
  border-top-color: #e75480;
}
</style>

<script>
import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
import GmapCustomMarker from "vue2-gmap-custom-marker";
import { waiting_time } from "../waitingtime";
import { maps_api } from "../mapsApi";
import { zoomToRadiusDict } from "../mapsApi";
import { search_api } from "../search";
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
      // Default zoom level set to 12
      zoom: 12,
      radius: 5000,
    };
  },

  mounted() {
    // Obtains the current user location if location settings are enabled, else locationOn flag is set to false
    maps_api.getPosition().then((location) => {
      if (location) {
        this.center = location;
        this.markerCenter = location;
        this.locationOn = true;
      } else this.locationOn = false;
    });
  },

  methods: {
    // Sets active the location index and opens up its info window
    setActive(index) {
      this.activeIndex = index;
      this.windowOpen = true;
    },

    // Inactivates the location index so that no location is highlighted
    setInactive() {
      this.activeIndex = undefined;
    },

    // Marker coordinates are set to the center of the map upon drag so that marker always remains in center
    updateMarkerCenter() {
      // Obtains current center using the map reference
      this.markerCenter = {
        lat: this.$refs.map.$mapObject.getCenter().lat(),
        lng: this.$refs.map.$mapObject.getCenter().lng(),
      };

      // Displays the search from here button only if the search box is not empty
      if (this.searchItem != null) this.dragged = true;
    },

    // Updates the radius according to zoom level
    updateRadius(event) {
      // If zoom level is less than or equal to 8, search radius is 50km (maximum value allowed by Maps API)
      if (event <= 8) this.radius = 50000;
      // If the zoom level is greater than or equal to 21, radius is just 100m as the granularity of search is very fine
      else if (event >= 21) this.radius = 100;
      // Otherwise get corresponding radius from the zoomToRadius dictionary
      else this.radius = zoomToRadiusDict[event];
    },

    navigateToQueuePage(id) {
      this.$router.replace("queue/" + id);
    },

    // Calls function to convert numerical waiting time to hours format
    convertToHours(num) {
      return waiting_time.convertToHours(num);
    },

    // Auto centers the map when new markers are added
    autoCenter() {
      this.$refs.map.$mapObject.setCenter(this.markers[0].position);
      var bounds = this.$refs.map.$mapObject.getBounds();
      for (var i = 0; i < this.markers.length; i++)
        bounds.extend(this.markers[i].position);

      this.$refs.map.$mapObject.fitBounds(bounds);
    },

    search: function() {
      // Does not make a request if query is empty
      if (this.searchItem == null) return;
      // Dragged variable set to false as new query is made from the location
      this.dragged = false;
      // Status set to loading (1) when the query is made
      this.status = 1;
      // Previous markers are cleared for the new query
      this.markers = [];

      // Checks if search query includes keywords such as near
      var isSearchWithNear = search_api.checkNearbyWords(this.searchItem);
      // Obtains list of stores & their details based on user query
      search_api
        .getStoresArray(this.markerCenter, this.radius, this.searchItem)
        .then((stores) => {
          this.markers = stores;
          // If no stores are returned, status is set to no shops found (status code -1)
          if (stores.length == 0) {
            this.status = -1;
          } else {
            // If some stores are returned, status is reset to non-loading (status code 0)
            this.status = 0;
            // If query contains keywords such as near, recenter the map based on new markers
            if (isSearchWithNear) this.autoCenter;
          }
        });
    },
  },
};
</script>
