import firebase from "firebase";
import { maps_api } from "./mapsApi";
import { waiting_time } from "./waitingtime";
import axios from "axios";

export const search_api = {
  // Returns a sorted list of stores (& their details) based on user query
  getStoresArray: function(markerCenter, radius, searchItem) {
    let promises = [];
    var queues = [];
    let that = this;
    return this.getListOfPlaces(markerCenter, radius, searchItem).then(
      (response) => {
        // Iterate over each store response from Places API
        for (var i = 0; i < response.data.results.length; i++) {
          let store = response.data.results[i];
          // Push each promise to the array
          promises.push(
            this.getStoreRefFromDB(store.place_id)
              .child("IsEnabled")
              .once("value")
              .then(function(snap) {
                // Checks if the queue is enabled at the store (value of IsEnabled must be true)
                if (snap.val()) {
                  return that
                    .getStoreDetails(store, markerCenter)
                    .then((store) => {
                      queues.push(store);
                    });
                }
              })
          );
        }
        // Wait for all promises to return and then sort the queue
        return Promise.all(promises).then(() => {
          return this.sortStoresArray(queues);
        });
      }
    );
  },

  // Sorts stores based on wait & travel time and returns the list
  sortStoresArray: function(queues) {
    return queues.sort(function(a, b) {
      // User serve time is calculated as the maximum value between travel / waiting time as that is the time estimate for when the user's turn will come
      var aTime = Math.max(a.travelTime, a.waitingTime);
      var bTime = Math.max(b.travelTime, b.waitingTime);
      // Sort in ascending order of time
      return aTime - bTime;
    });
  },

  // Returns a dictionary with all store details
  getStoreDetails: function(store, center) {
    let promises = [];
    // Obtains travel time between user and store location
    promises.push(maps_api.getTravelTime(store.place_id, center));
    // Obtains waiting time based on queue length
    promises.push(waiting_time.getWaitingTimeAsync(store.place_id));
    // Waits for the promises of the async functions (travel & wait time calculation) to return
    return Promise.all(promises).then((values) => {
      // Stores the time duration field of the API response - divide by 60 as the value is in seconds
      let travelTime = Math.floor(
        values[0].data.rows[0].elements[0].duration.value / 60
      );
      let waitingTime = values[1];
      // Forms a dictionary with wait & travel time results and other relevant store details
      return {
        location: store.name,
        position: store.geometry.location,
        id: store.place_id, // Stores the unique place ID of the shop
        travelTime: travelTime,
        waitingTime: waitingTime,
        img: maps_api.getImageUrl(store), // Obtains the image associated with a store
      };
    });
  },

  getStoreRefFromDB: function(storeId) {
    // Obtaining a reference to the firebase DB
    let dbRef = firebase.database().ref();
    // Referencing the store with given ID in the DB
    return dbRef.child("Store").child(storeId);
  },

  // Requests Textsearch API for list of stores based on user query and location
  getListOfPlaces: function(center, radius, query) {
    // Parameters in the required format for Text Search API
    let placesParams = {
      location: center.lat + "," + center.lng,
      radius: radius,
      query: query,
      key: process.env.VUE_APP_MAPS_API_KEY,
    };
    return axios.get(process.env.VUE_APP_PLACES_URL, { params: placesParams });
  },
};
