import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
Vue.use(VueAxios, axios);

export const search_api = {
  calculateTravelTime: function(place_id, center) {
    // let center = this.$userLocation;
    let distanceParams = {
      origins: center.lat + "," + center.lng,
      destinations: "place_id:" + place_id,
      departure_time: "now",
      key: process.env.VUE_APP_DISTANCE_API_KEY,
    };

    return axios
      .get(process.env.VUE_APP_DISTANCE_URL, {
        params: distanceParams,
      })
      .then((response) => {
        // returning the data here allows the caller to get it through another .then(...)
        return response;
      });
  },

  geolocate: function(that) {

    navigator.geolocation.getCurrentPosition((position) => {
      let userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      
      that.center = userLocation;
      that.markerCenter = userLocation;
    });
  },

};
