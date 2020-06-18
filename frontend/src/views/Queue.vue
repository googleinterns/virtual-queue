<template>
  <div class="Queue">
    <h1>Welcome to the Queue page</h1>
    <br />
    <div v-if="uid">
      <h2>Your UserID is : {{ uid }}</h2>
    </div>
    <div v-else>
      <h2>Login to enroll to in the queue</h2>
    </div>
    <br />
    <h2>You are in Store : {{ storeId }}</h2>
    <div v-if="isEnabled">
      <br />
      <br />
      <highcharts
        :options="chartOptions"
        ref="lineCharts"
        :constructor-type="chart"
      ></highcharts>
      <br />
      <br />
      <div v-if="isUserLoaded">
        <div v-if="!isUserEnrolled">
          <h2>The size of the queue is : {{ queueLength }}</h2>
          <h2>
            Waiting Time for this queue is : {{ waitingTimeInHoursUnenrolled }}
          </h2>
          <h2>Your turn will arrive at: {{ expectedTimeUnenrolled }}</h2>
        </div>
        <div v-else>
          <h2>Your position in the queue is : {{ queuePosition }}</h2>
          <h2>Your token number is : {{ tokenNumber }}</h2>
          <h2>Your waiting time is : {{ waitingTimeInHours }}</h2>
          <h2>Your turn will arrive at: {{ expectedTime }}</h2>
        </div>
        <button :disabled="isUserEnrolled" @click="enterQueue">
          Enter Queue
        </button>
        <br /><br />
        <button :disabled="!isUserEnrolled" @click="exitQueue">
          Leave Queue
        </button>
      </div>
      <div v-else-if="!uid">
        <h2>The size of the queue is : {{ queueLength }}</h2>
        <h2>
          Waiting time for this queue is : {{ waitingTimeInHoursUnenrolled }}
        </h2>
        <h2>Your turn will arrive at: {{ expectedTimeUnenrolled }}</h2>
      </div>
    </div>
    <div v-else>
      <h2>Queue Disabled.</h2>
    </div>
    <br /><br />
  </div>
</template>

<script>
import { database_call } from "../database.js";
import { waiting_time } from "../waitingtime.js";
import { Chart } from "highcharts-vue";

export default {
  name: "Queue",
  components: { highcharts: Chart },
  data() {
    return {
      storeId: this.$route.params.StoreId,
      uid: null,
      currentUserKey: null,
      currentStoreKey: null,
      isUserLoaded: false,
      isUserEnrolled: false,
      queueLength: 0,
      queuePosition: 0,
      tokenNumber: 0,
      isEnabled: null,
      waitingTime: 0,
      waitingTimeInHours: null,
      waitingTimeInHoursUnenrolled: null,
      expectedTime: null,
      expectedTimeUnenrolled: null,
      chartOptions: {
        chart: { type: "areaspline" },
        title: {
          text: "Current Queue Status",
          style: {
            fontSize: "20px",
          },
        },
        subtitle: {
          text: "",
          style: {
            fontSize: "15px",
          },
        },
        xAxis: {
          categories: [],
          title: {
            text: "Token Range",
            style: {
              fontSize: "14px",
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
              fontSize: "14px",
              fontWeight: "bold",
            },
          },
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
    // Set isEnabled of store
    storeInit: function() {
      var that = this;
      database_call.getStoreInfo(that.storeId, function(store) {
        that.isEnabled = store.IsEnabled;
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
                  that.expectedTime = waiting_time.convertTimeToETA(
                    waitingTime
                  );
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
    // Listening to changes in the queue
    database_call.setQueueIncListener(this.storeId, this.queueInc);
    database_call.setQueueDecListener(this.storeId, this.queueDec);
    database_call.setPowerCurveListener(this.storeId, this.makeGraph);
  },
};
</script>
