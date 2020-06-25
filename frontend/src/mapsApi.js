import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
Vue.use(VueAxios, axios);

// Map radius corresponsding to zoom level
export const zoomToRadiusDict = {
  20: 100,
  19: 250,
  18: 500,
  17: 1000,
  16: 1000,
  15: 1000,
  14: 1500,
  13: 2000,
  12: 5000,
  11: 10000,
  10: 25000,
  9: 50000,
};

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
