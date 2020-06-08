<template>
  <div>
    <div>
      <label>
        <gmap-autocomplete
          style="width:50%;"
          @place_changed="setPlace">
        </gmap-autocomplete
        >
        <button @click="addMarker">Add</button>
      </label>
      <br/>

    </div>
    <br>

    <ul id="example-1">
  <li v-for="mark in markers" :key="mark.location">
    {{ mark.location }}
  </li>
</ul>
    <gmap-map
      :center="center"
      :zoom="12"
      style="width:100%;  height: 400px;"
    >
      <gmap-marker
        :key="index"
        v-for="(m, index) in markers"
        :position="m.position"
        @click="Queue"
      ></gmap-marker>
    </gmap-map>
  </div>
</template>

<script>
import firebase from "firebase";
export default {
  name: "Map",
  data() {
    return {
      // default to Montreal to keep it simple
      // change this to whatever makes sense

      center: { lat: 28.7041, lng: 78.1025 },
      markers: [
        {
          location: "Hotel 1",
          position: {lat: 28.5379, lng: 77.1970},
          queue_id: "1",
        },
        {
          location: "Hotel 2",
          position: {lat: 28.5473, lng: 77.2034}
        }
      ],
      // markers: [{position: {lat: 28.5479, lng: 77.2031 }, location:"Hotel Palace", queueid:"1"}],
      places: [],
      currentPlace: null,
    };
  },

  mounted() {
    this.geolocate();
    firebase.database().ref().child("Store").once("value", function(snap){
      // this.markers = null
      snap.forEach(function(childSnap){
        var store = childSnap.val();
        console.log(store.StoreName, store.lat, store.lng);
        // this.markers.push({ 
        //   location: store.StoreName,
        //   position: {lat: store.lat, lng: store.lng}
        // });
      });
      
    });

  },

  // created(){

  //   firebase.database().ref().child("Store").once("value", function(snap){
  //     // this.markers = null
  //     snap.forEach(function(childSnap){
  //       var store = childSnap.val();
  //       console.log(store.StoreName, store.lat, store.lng);
  //       this.markers.push({ 
  //         location: store.StoreName,
  //         position: {lat: store.lat, lng: store.lng}
  //       });
  //     });
      
  //   });

  // },

  methods: {

    Queue(){
      this.$router.replace("sign-up");
    },
    // receives a place object via the autocomplete component
    setPlace(place) {
      this.currentPlace = place;
    },
    addMarker() {
      if (this.currentPlace) {
        const marker = {
          lat: this.currentPlace.geometry.location.lat(),
          lng: this.currentPlace.geometry.location.lng()
        };
        this.markers.push({ position: marker });
        this.places.push(this.currentPlace);
        this.center = marker;
        this.currentPlace = null;
      }
    },
    geolocate: function() {
      navigator.geolocation.getCurrentPosition(position => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      });
    }
  }
};
</script>