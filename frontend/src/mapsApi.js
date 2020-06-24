import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
Vue.use(VueAxios, axios);

export const maps_api = {

  // Queries Maps Distance Matrix API for the time taken to travel from the user's location to the store
  calculateTravelTime: function(placeId, center) {
    
    // Parameters in the format required for Maps API
    let distanceParams = {
      origins: center.lat + "," + center.lng,
      destinations: "place_id:" + placeId,
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

  // Returns the current location (latitude & longitude) of the user
  getPosition: function() {
    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    })
      .then((position) => {
        let userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        return userLocation;
      })
      .catch((error) => {
        console.log(error.message);
      });
  },

  getLocationDisabledError: function(){
    return "Kindly enable your location for the best experience of our app"
  }
};
