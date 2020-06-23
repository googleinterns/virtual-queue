const axios = require("axios");
const firebase = require("firebase");
const readline = require("readline");
require("dotenv").config({ path: __dirname + "/../.env" });

const config = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_PROJECT_ID + ".firebaseapp.com",
  databaseURL:
    "https://" + process.env.VUE_APP_FIREBASE_PROJECT_ID + ".firebaseio.com",
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_PROJECT_ID + ".appspot.com",
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APPID,
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID,
};

firebase.initializeApp(config);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// USER_ID that will be assigned the stores ownership
const USER_ID = "2L2GVG7rIPZojeSEixUWDdsu2Eh1";

rl.question("Please enter your location ", function(location) {
  // let shops = ["liquor", "grocery", "food", "pizza", "restaurant", "medicine"];
  let shops = ["grocery"]
  // Iterates over various types of common shops
  for (var i = 0; i < shops.length; i++) {
    // Requests Places Search API for relevant stores near input location
    axios
      .get(
        "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" +
          shops[i] +
          " " +
          `${location}` +
          "&key=" +
          process.env.VUE_APP_MAPS_API_KEY
      )
      .then((response) => {
        for (var j = 0; j < response.data.results.length; j++) {
          let place_id = response.data.results[j].place_id;
          // Iterates over each place ID and request Places Details API for address, phone, opening hrs & rating
          axios
            .get(
              "https://maps.googleapis.com/maps/api/place/details/json?place_id=" +
                place_id +
                "&fields=name,rating,formatted_phone_number,formatted_address,types,opening_hours,website&key=" +
                process.env.VUE_APP_MAPS_API_KEY
            )
            .then((response) => {
              let storeDetails = response.data.result;
              console.log(storeDetails.name);
              let values = {
                IsEnabled: true,
                // Assigns a random value between 5-15 (both inclusive) to the serve time of a store
                AvgServeTime: Math.floor(Math.random() * 10) + 5,
                // Assigns a value between 1-51 (both inclusive) to the current token of store
                CurrentToken: Math.floor(Math.random() * 50) + 1,
                StoreName: storeDetails.name,
                // Initializes queue length as 0 as no users are enrolled yet
                QueueLength: 0,
              };

              // Checks for presense of attributes in Places Details API results and assigns values accordingly
              if (storeDetails.formatted_phone_number)
                values.Phone = storeDetails.formatted_phone_number;

              if (storeDetails.formatted_address)
                values.Address = storeDetails.formatted_address;

              if (storeDetails.rating) values.Rating = storeDetails.rating;

              if (
                storeDetails.opening_hours &&
                storeDetails.opening_hours.periods
              )
                values.OperatsionalHours = storeDetails.opening_hours.periods;
              // Adds all store details to DB with place ID 
              firebase
                .database()
                .ref("Store/" + place_id)
                .set(values);
              // Assigns USER_ID the ownership of the store in DB
              firebase
                .database()
                .ref("User/" + USER_ID + "/OwnedStoreID/" + place_id)
                .set({
                  StoreID: place_id,
                });
            })
            .catch((error) => console.log(error));
        }
      })
      .catch((error) => console.log(error));
  }
  rl.close();
});
