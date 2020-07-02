<template>
  <div class="Queue">
    <h1 class="title is-3">{{ storeName }}</h1>
    <h3 class="columns is-centered is-mobile is-gapless" v-if="address != null">
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
          <p v-if="travelTime">{{ travelTime }} away</p>
          <p class="error-sign" v-if="locationOn == false">
            {{ locationDisabledError }}
          </p>
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
            You would have to wait till:
            <span class="bold">{{ expectedTimeUnenrolled }}</span
            ><br />({{ waitingTimeInHoursUnenrolled }}
            from now)
          </h2>
          <div v-if="waitingTime == 0" class="is-size-6 has-text-info">
            <p>There's no-one in the queue :)<br /></p>
          </div>
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
              <span class="tooltiptext" id="myTooltip">Click to share</span>
              <font-awesome-icon icon="share-alt" />
            </button>
          </span>
          <h2>
            Turn will arrive in slot:
            <b> {{ expectedTimeBegin }} - {{ expectedTimeEnd }} </b>
            <br />
          </h2>
          <div
            v-if="waitingTimeEnrolled == 0"
            class="is-size-6 has-text-danger"
          >
            <p>You should be at the store now!<br /></p>
          </div>
          <br />
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
          You would have to wait till:
          <span class="bold">{{ expectedTimeUnenrolled }}</span
          ><br />({{ waitingTimeInHoursUnenrolled }}
          from now)
        </h2>
        <div v-if="waitingTime == 0" class="is-size-6 has-text-info">
          <p>There's no-one in the queue :)<br /></p>
        </div>
        <br />
        <button class="button is-info is-light">
          <router-link class="has-text-black" :to="{ name: 'Login' }"
            >Login to enroll to the queue</router-link
          >
        </button>
      </div>
      <br />
      <br />
      <div class="columns is-centered is-mobile is-gapless">
        <highcharts
          class="column is-11"
          :options="chartOptions"
          ref="lineCharts"
          :constructor-type="chart"
        ></highcharts>
      </div>
      <h1 class="has-text-dark is-size-7 width-80">
        Disclaimer: From this graph you can predict percentage of queue resolved
        in token ranges of 20.
      </h1>
      <br />
      <br />
    </div>
    <!--if Queue is not enabled-->
    <div class="is-size-5 is-danger" v-else-if="isEnabled != null">
      <h3>Currently closed !</h3>
      <h3>Queue Disabled !</h3>
    </div>
    <br /><br />
  </div>
</template>

<script>
import { database_call } from "../database.js";
import { waiting_time } from "../waitingtime.js";
import { maps_api } from "../mapsApi";
import { Chart } from "highcharts-vue";
import moment from "moment";
import { graph_call } from "../graph.js";

export default {
  name: "Queue",
  components: {
    highcharts: Chart,
  },
  data() {
    var locationDisabledError = maps_api.getLocationDisabledError();

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
      locationDisabledError: locationDisabledError,
      waitingTime: 0,
      waitingTimeEnrolled: 0,
      waitingTimeInHours: 0,
      waitingTimeInHoursUnenrolled: "0 minutes",
      expectedTime: 0,
      expectedTimeBegin: 0,
      expectedTimeEnd: 0,
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
              color: "#D3D3D3",
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
      tooltip.innerHTML = "Share Now!";
    },
    // When copy through share button is unsuccessful
    onCopyError: function() {
      var tooltip = document.getElementById("myTooltip");
      tooltip.innerHTML = "Failed to copy";
    },
    // This function called when we hover over share button
    outFunc: function() {
      var tooltip = document.getElementById("myTooltip");
      tooltip.innerHTML = "Click to share";
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
      if (this.uid) {
        database_call.isUserInQueue(this.storeId, this.uid, function(
          isEnrolled
        ) {
          if (isEnrolled) {
            that.isUserEnrolled = true;
            database_call.getUserInfo(that.storeId, that.uid, function(
              userInfo
            ) {
              that.queuePosition = userInfo.queuePosition;
              that.currentUserKey = userInfo.currentUserKey;
              that.tokenNumber = userInfo.tokenNumber;
              waiting_time.calculateWaitingTime(
                that.storeId,
                that.queuePosition,
                function(waitingTime) {
                  that.waitingTimeEnrolled = waitingTime;
                  that.waitingTimeInHours = waiting_time.convertToHours(
                    waitingTime
                  );
                  that.expectedTime = waiting_time.convertTimeToETA(
                    waitingTime
                  );
                  console.log(that.expectedTime);
                  that.expectedTimeBegin = moment()
                    .add(waitingTime, "minutes")
                    .subtract(7.5, "minutes")
                    .format("LT");
                  that.expectedTimeEnd = moment()
                    .add(waitingTime, "minutes")
                    .add(7.5, "minutes")
                    .format("LT");
                }
              );
            });
            database_call.getCurrentStoreKey(that.storeId, that.uid, function(
              currentStoreKey
            ) {
              that.currentStoreKey = currentStoreKey;
            });
          } else {
            that.isUserEnrolled = false;
          }
          that.isUserLoaded = true;
        });
      } else {
        waiting_time.getWaitingTime(that.storeId, function(waitingTime) {
          that.waitingTimeInHoursUnenrolled = waiting_time.convertToHours(
            waitingTime
          );
          that.expectedTimeUnenrolled = waiting_time.convertTimeToETA(
            waitingTime
          );
          that.waitingTime = waitingTime;
        });
      }
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
              that.waitingTimeEnrolled = waitingTime;
              that.waitingTimeInHours = waiting_time.convertToHours(
                waitingTime
              );
              that.expectedTime = waiting_time.convertTimeToETA(waitingTime);
              that.expectedTimeBegin = moment()
                .add(waitingTime, "minutes")
                .subtract(7.5, "minutes")
                .format("LT");
              that.expectedTimeEnd = moment()
                .add(waitingTime, "minutes")
                .add(7.5, "minutes")
                .format("LT");
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
        that.waitingTime = waitingTime;
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
        that.waitingTime = waitingTime;
      });

      // Decrementing Queue Position
      if (this.isUserEnrolled) {
        if (this.currentUserKey > snap.key) {
          this.queuePosition--;
          waiting_time.calculateWaitingTime(
            that.storeId,
            that.queuePosition,
            function(waitingTime) {
              that.waitingTimeEnrolled = waitingTime;
              that.waitingTimeInHours = waiting_time.convertToHours(
                waitingTime
              );
              that.expectedTime = waiting_time.convertTimeToETA(waitingTime);
              that.expectedTimeBegin = moment()
                .add(waitingTime, "minutes")
                .subtract(7.5, "minutes")
                .format("LT");
              that.expectedTimeEnd = moment()
                .add(waitingTime, "minutes")
                .add(7.5, "minutes")
                .format("LT");
            }
          );
        }
      }
    },
  },
  created() {
    this.storeInit();
    this.userInit();
  },
  mounted() {
    maps_api.getPosition().then((location) => {
      if (location) {
        maps_api
          .calculateTravelTime(this.storeId, location)
          .then((response) => {
            this.travelTime = response.data.rows[0].elements[0].duration.text;
            this.locationOn = true;
          });
      } else {
        this.locationOn = false;
      }
    });

    // Listening to changes in the queue
    database_call.setQueueIncListener(this.storeId, this.queueInc);
    database_call.setQueueDecListener(this.storeId, this.queueDec);
    database_call.setPowerCurveListener(this.storeId, (snap) => {
      graph_call.renderLineGraph(snap, this.uid, this.chartOptions);
    });
  },
};
</script>

<style scoped>
.bold {
  font-weight: bold;
}
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
