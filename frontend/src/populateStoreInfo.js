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

const USER_ID = "2L2GVG7rIPZojeSEixUWDdsu2Eh1";

rl.question("Please enter your location ", function(location) {
  let shops = ["liquor", "food", "grocery", "pizza", "restaurant", "medicine"];
  // let shops = ["liquor"]
  for (var i = 0; i < shops.length; i++) {
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
          // console.log(response.data.results[j].name);
          let place_id = response.data.results[j].place_id;
          axios
            .get(
              "https://maps.googleapis.com/maps/api/place/details/json?place_id="+place_id+"&fields=name,rating,formatted_phone_number,formatted_address,types,opening_hours,website&key=AIzaSyB5zdJrg17CL2W9wxiXsLvAdoztzhxMdPo"
            )
            .then((response) => {
              console.log(response.data.result.name);
              let values = {
                IsEnabled: true,
                AvgServeTime: Math.floor(Math.random() * 20) + 1,
                CurrentToken: Math.floor(Math.random() * 50) + 1,
                StoreName: response.data.result.name,
                QueueLength: 0,
              }
              if(response.data.result.formatted_phone_number)
                values.Phone = response.data.result.formatted_phone_number;
              
                if(response.data.result.formatted_address)
                values.Address = response.data.result.formatted_address;

              firebase
                .database()
                .ref("Store/" + place_id)
                .set(values);
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
