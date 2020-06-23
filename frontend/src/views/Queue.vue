<template>
  <div class="Queue">
    <h1 class="title is-3">{{ storeName }}</h1>
    <h3 class="columns is-centered is-mobile" v-if="address != null">
      <h3 class="column is-8">
        {{ address }}
        <br />
        <a
          id="location"
          v-bind:href="
            'https://www.google.com/maps/search/?api=1&query=<address>&query_place_id=' +
              storeId
          "
        >
          <i class="fa fa-map-marker fa-2x" aria-hidden="true"></i>
          <p>{{ travelTime }} </p>
          <p class="error-sign" v-if="locationOn == false">Kindly enable your location for the best experience of our app</p>
        </a>
      </h3>
    </h3>
    <h3 v-if="phone != null"><font-awesome-icon icon="phone" /> {{ phone }}</h3>
    <br />
    <br />

    <!--If queue for the store is enabled-->
    <div class="is-size-5" v-if="isEnabled">
      <!--If userInfo is loaded also means person is logged in-->
      <div v-if="isUserLoaded">
        <!--If person has not enrolled to the queue-->
        <div v-if="!isUserEnrolled">
          <h2>
            You would have to wait till: {{ expectedTimeUnenrolled }} ({{
              waitingTimeInHoursUnenrolled
            }}
            more)
          </h2>
        </div>
        <!--If person has enrolled to the queue-->
        <div class="tooltip" v-else>
          <span>
            Token Number :
            <span class="is-size-1">{{ tokenNumber }} </span>
            <button
              @click="shareContent"
              @onmouseout="outFunc()"
              id="shareIcon"
              class="button is-warning is-light"
              type="button"
              v-clipboard:copy="textToShare"
              v-clipboard:success="onShareCopy"
              v-clipboard:error="onCopyError"
            >
              <span class="tooltiptext" id="myTooltip">Copy to clipboard</span>
              <font-awesome-icon icon="share-alt" />
            </button>
          </span>
          <h2>
            Time to reach store: {{ expectedTime }} ({{ waitingTimeInHours }}
            remaining)
          </h2>
        </div>
        <br />
        <button
          class="button is-success is-light"
          :disabled="isUserEnrolled"
          @click="enterQueue"
        >
          Enter Queue
        </button>
        &nbsp; &nbsp; &nbsp;
        <button
          class="button is-danger is-light"
          :disabled="!isUserEnrolled"
          @click="exitQueue"
        >
          Leave Queue
        </button>
      </div>
      <!--if person is not logged in-->
      <div v-else-if="!uid">
        <h2>
          You would have to wait till: {{ expectedTimeUnenrolled }} ({{
            waitingTimeInHoursUnenrolled
          }}
          more)
        </h2>
        <br />
        <button class="button is-info is-light">
          <router-link class="has-text-black" :to="{ name: 'Login' }"
            >Login to enroll to the queue</router-link
          >
        </button>
      </div>
      <br />
      <br />
      <div class="columns is-centered">
        <highcharts
          class="column is-four-fifths"
          :options="chartOptions"
          ref="lineCharts"
          :constructor-type="chart"
        ></highcharts>
      </div>
      <h1 class="has-text-dark is-size-7">
        Disclaimer: From this graph you can predict percentage of queue resolved
        in token ranges of 20.
      </h1>
      <br />
      <br />
    </div>
    <!--if Queue is not enabled-->
    <div class="is-size-5 is-danger" v-else-if="isEnabled != null">
      <h3>Currently closed !!</h3>
      <h3>Queue Disabled !!</h3>
    </div>
    <br /><br />
  </div>
</template>

<script>
import { database_call } from "../database.js";
import { waiting_time } from "../waitingtime.js";
import { maps_api } from "../mapsApi";
import { Chart } from "highcharts-vue";

export default {
  name: "Queue",
  components: {
    highcharts: Chart,
  },
  data() {
    return {
      textToShare: null,
      storeId: this.$route.params.StoreId,
      storeName: null,
      address: null,
      phone: null,
      uid: null,
      currentUserKey: null,
      currentStoreKey: null,
      isUserLoaded: false,
      isUserEnrolled: false,
      queueLength: 0,
      queuePosition: 0,
      tokenNumber: 0,
      isEnabled: null,
      travelTime: null,
      locationOn: null,
      waitingTime: 0,
      waitingTimeInHours: 0,
      waitingTimeInHoursUnenrolled: "0 minutes",
      expectedTime: 0,
      expectedTimeUnenrolled: null,
      chartOptions: {
        chart: { type: "areaspline" },
        title: {
          text: "Current Queue Status",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
          },
        },
        subtitle: {
          text: "",
          style: {
            fontSize: "17px",
          },
        },
        credits: {
          enabled: false,
        },
        xAxis: {
          categories: [],
          title: {
            text: "Token Range",
            style: {
              fontSize: "16px",
              fontWeight: "bold",
            },
          },
          plotLines: [
            {
              color: "#A9A9A9",
              dashStyle: "solid",
              value: null,
              width: 10,
            },
          ],
        },
        yAxis: {
          title: {
            text: "Percentage of People Resolved (%)",
            style: {
              fontSize: "16px",
              fontWeight: "bold",
            },
          },
          tickInterval: 20,
          labels: {
            style: {
              fontSize: "14px",
            },
          },
          min: 0,
          max: 100,
        },
        tooltip: {
          shared: true,
          valueSuffix: "%",
        },
        series: [
          {
            name: "",
            data: [],
            color: "#A52A2A",
            fillOpacity: 0.1,
            showInLegend: false,
          },
        ],
      },
    };
  },
  methods: {
    // When copy through share button is successful
    onShareCopy: function() {
      var tooltip = document.getElementById("myTooltip");
      tooltip.innerHTML = "Copied!!!";
    },
    // When copy through share button is unsuccessful
    onCopyError: function() {
      var tooltip = document.getElementById("myTooltip");
      tooltip.innerHTML = "Failed to copy";
    },
    // This function called when we hover over share button
    outFunc: function() {
      var tooltip = document.getElementById("myTooltip");
      tooltip.innerHTML = "Copy to clipboard";
    },
    // The content copied when share button is clicked
    shareContent: function() {
      this.textToShare =
        this.storeName +
        "\n" +
        this.address +
        "\n" +
        this.phone +
        "\n" +
        "Token No.: " +
        this.tokenNumber;
    },
    // Getting info about the store
    storeInit: function() {
      var that = this;
      database_call.getStoreInfo(that.storeId, function(store) {
        that.isEnabled = store.IsEnabled;
        that.address = store.Address;
        that.storeName = store.StoreName;
        that.phone = store.Phone;
      });
    },
    // Function to populate intial data values
    userInit: function() {
      var that = this;
      this.uid = database_call.getUserId();
      database_call.isUserInQueue(this.storeId, this.uid, function(isEnrolled) {
        if (isEnrolled) {
          that.isUserEnrolled = true;
          database_call.getUserInfo(that.storeId, that.uid, function(
            queuePosition,
            currentUserKey,
            tokenNumber
          ) {
            that.queuePosition = queuePosition;
            that.currentUserKey = currentUserKey;
            that.tokenNumber = tokenNumber;
            waiting_time.calculateWaitingTime(
              that.storeId,
              that.queuePosition,
              function(waitingTime) {
                that.waitingTime = waitingTime;
                that.waitingTimeInHours = waiting_time.convertToHours(
                  waitingTime
                );
                that.expectedTime = waiting_time.convertTimeToETA(waitingTime);
              }
            );
          });
          database_call.getCurrentStoreKey(that.storeId, that.uid, function(
            currentStoreKey
          ) {
            that.currentStoreKey = currentStoreKey;
          });
          waiting_time.getWaitingTimeEnrolled(
            that.storeId,
            that.userId,
            function(waitingTime) {
              that.waitingTime = waitingTime;
            }
          );
        } else {
          that.isUserEnrolled = false;
        }
        that.isUserLoaded = true;
      });
    },
    enterQueue: function() {
      var that = this;
      database_call.addToQueue(this.storeId, this.uid, function(
        currentStoreKey,
        currentUserKey,
        token,
        error
      ) {
        if (error) {
          console.log(error);
        } else {
          that.currentUserKey = currentUserKey;
          that.currentStoreKey = currentStoreKey;
          that.isUserEnrolled = true;
          that.queuePosition = that.queueLength;
          that.tokenNumber = token;
          waiting_time.calculateWaitingTime(
            that.storeId,
            that.queuePosition,
            function(waitingTime) {
              that.waitingTime = waitingTime;
              that.waitingTimeInHours = waiting_time.convertToHours(
                waitingTime
              );
              that.expectedTime = waiting_time.convertTimeToETA(waitingTime);
            }
          );
        }
      });
    },
    exitQueue: function() {
      var that = this;
      database_call.removeFromQueue(
        this.storeId,
        this.uid,
        this.currentStoreKey,
        this.currentUserKey,
        function(error) {
          if (error) {
            console.log(error);
          } else {
            that.isUserEnrolled = false;
          }
        }
      );
    },
    // Incrementing Queue Length
    queueInc: function() {
      this.queueLength++;
      var that = this;
      waiting_time.getWaitingTime(that.storeId, function(waitingTime) {
        that.waitingTimeInHoursUnenrolled = waiting_time.convertToHours(
          waitingTime
        );
        that.expectedTimeUnenrolled = waiting_time.convertTimeToETA(
          waitingTime
        );
      });
    },
    queueDec: function(snap) {
      // Decrementing Queue Length
      this.queueLength--;
      var that = this;
      waiting_time.getWaitingTime(that.storeId, function(waitingTime) {
        that.waitingTimeInHoursUnenrolled = waiting_time.convertToHours(
          waitingTime
        );
        that.expectedTimeUnenrolled = waiting_time.convertTimeToETA(
          waitingTime
        );
      });

      // Decrementing Queue Position
      if (this.isUserEnrolled) {
        if (this.currentUserKey > snap.key) {
          this.queuePosition--;
          waiting_time.calculateWaitingTime(
            that.storeId,
            that.queuePosition,
            function(waitingTime) {
              that.waitingTime = waitingTime;
              that.waitingTimeInHours = waiting_time.convertToHours(
                waitingTime
              );
              that.expectedTime = waiting_time.convertTimeToETA(waitingTime);
            }
          );
        }
      }
    },
    // Function to create Power-curve
    makeGraph: function(snap) {
      var lineGraph = [];
      var firstToken = 0,
        lastToken = 0;
      var firstTokenFlag = 0;
      var currentUserToken = null;
      snap.forEach(function(child) {
        if (firstTokenFlag == 0) {
          // firstTokenflag = 0 detects we are on first token
          firstToken = child.child(database_call.getTokenIdField()).val();
          firstTokenFlag = 1;
        }
        if (
          database_call.getUserId() ==
          child.child(database_call.getUserIdField()).val()
        ) {
          currentUserToken = child.child(database_call.getTokenIdField()).val();
        }
        lastToken = Math.max(
          lastToken,
          child.child(database_call.getTokenIdField()).val()
        );
      });

      var range = 20;
      // minMostToken is the token from where the graph starts
      var minMostToken = firstToken - ((firstToken - 1) % range);

      // initialising ranges in lineGraph array
      for (
        var lowerBound = minMostToken;
        lowerBound <= lastToken;
        lowerBound += range
      ) {
        var pair = [];
        var upperBound = lowerBound + range - 1;
        var key = lowerBound.toString() + "-" + upperBound.toString();
        pair.push(key);
        // pushing 100 to replicate it with percentage
        pair.push(100);
        lineGraph.push(pair);
      }

      var factor = (minMostToken - 1) / range;

      // decrementing the people in a range who are not yet resolved
      snap.forEach(function(child) {
        var tokenId = child.child(database_call.getTokenIdField()).val();
        var index = Math.floor((tokenId - 1) / range) - factor;
        // converting number of people into percentage of people resolved
        lineGraph[index][1] -= 100 / range;
      });

      var lineGraphX = [],
        lineGraphY = [];

      // putting X and Y axis values in lineGraphX and lineGraphY arrays respectively except the last range
      for (var itr = 0; itr < lineGraph.length - 1; itr++) {
        lineGraphX.push(lineGraph[itr][0]);
        lineGraphY.push(lineGraph[itr][1]);
      }

      // customizing Chart features
      this.chartOptions.series[0].data = lineGraphY;
      this.chartOptions.xAxis.categories = lineGraphX;

      // plotline will only be shown when user is logged in and entered in a queue and his token does not belong to last range
      if (
        currentUserToken != null &&
        currentUserToken <= Math.floor((lastToken - 1) / range) * range
      ) {
        var index = Math.floor(currentUserToken / range) - factor;
        this.chartOptions.xAxis.plotLines[0].value = index;
      } else {
        this.chartOptions.xAxis.plotLines[0].value = null;
      }

      // subtitle will be shown if firstToken is greater than 1
      if (firstToken > 1) {
        this.chartOptions.subtitle.text =
          "(People before token " +
          firstToken.toString() +
          " have been resolved)";
      } else {
        this.chartOptions.subtitle.text = null;
      }
    },
  },
  created() {
    this.storeInit();
    this.userInit();
  },
  mounted() {
    maps_api.getPosition().then((location) => {
      if(location){
        maps_api.calculateTravelTime(this.storeId, location).then((response) => {
        this.travelTime = response.data.rows[0].elements[0].duration.text;
        this.locationOn = true;
      });
    }
    else{
      this.locationOn = false;
    }
      
    });

    // Listening to changes in the queue
    database_call.setQueueIncListener(this.storeId, this.queueInc);
    database_call.setQueueDecListener(this.storeId, this.queueDec);
    database_call.setPowerCurveListener(this.storeId, this.makeGraph);
  },
};
</script>

<style scoped>
#shareIcon {
  top: -10px;
  min-height: 2em;
  vertical-align: middle;
}
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 140px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 150%;
  left: 50%;
  margin-left: -75px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
</style>
