<template>
  <div>
  <h1 class="title is-2">Search for your favourite stores!</h1>
    <div>
      <label>
      <div class="field is-grouped search">
        <p class="control is-expanded">
          <input class="input" type="text" placeholder="Pizza places near me">
        </p>
        <p class="control">
          <a class="button is-info">
            Search
          </a>
        </p>
      </div>
      </label>
      <br/>
    </div>
    <br>
    <div id="wrapper" class="content">
      <ul id="places" >
        <li v-for="(mark, index) in markers" :key="mark.location" :ref="`${mark.id}`" :class="{ 'active': activeIndex === index }">
          {{ mark.location }}
        </li>
      </ul>
      <gmap-map
        :center="center"
        :zoom="10"
        id="map"  
      >
        <gmap-marker
          :key="index"
          v-for="(m, index) in markers"
          :position="m.position"
          @click="navigateToQueuePage(m.id)"
          @mouseover="setActive(index)"
          @mouseout="setInactive"
        ></gmap-marker>
      </gmap-map>
    </div>
  </div>
</template>

<style scoped>
  
  #wrapper{
    width:80%;
    display:flex;
    justify-content:center;
    margin: 0 auto;
  }

  #places, #map{
    margin: 2%;
  }

  #map{
    width:70%;
    height:500px;
  }

  .active{
    background-color: #3298dc;
  }

  li{
    font-size: 25px;
  }

  .search{
    width:40%;
    margin: 0 auto;
  }

</style>

<script>
import firebase from "firebase";
export default {
  name: "Map",
  data() {

    var queues = []
    var center = { lat: 13.0166, lng: 77.6804 } // Default center to Google Bangalore office :)
    firebase.database().ref().child("Store").once("value", function(snap){
      snap.forEach(function(childSnap){
        var store = childSnap.val();
        center = { lat: store.Latitude, lng: store.Longitude }
        queues.push({ 
          location: store.StoreName,
          position: {lat: store.Latitude, lng: store.Longitude},
          id: childSnap.key,
        });
      });
    });

    return {
      center: center,
      markers: queues,
      activeIndex: undefined,
      places: [],
      currentPlace: null,
    };
  },

  mounted() {
    this.geolocate();
  },

  methods: {

    setActive(index){
      this.activeIndex = index;
    },

    setInactive(){
      this.activeIndex = undefined;
    },

    navigateToQueuePage(id){
      this.$router.replace("queue/"+id);
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