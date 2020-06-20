import { database_call } from "./database.js";
import moment from "moment";

export const waiting_time = {
  // Returns the expected waiting time for a user enrolled in the queue
  getWaitingTimeEnrolled(storeId, userId, callBack) {
    database_call.getStoreObject(storeId, function(store) {
      this.getQueuePosition(store, userId, function(queuePosition) {
        var waitingTime = store.AvgServeTime * (queuePosition - 1);
        callBack(waitingTime);
      });
    });
  },

  // Returns the waiting time given the queuePosition
  calculateWaitingTime(storeId, queuePosition, callBack) {
    database_call.getStoreInfo(storeId, function(store) {
      var waitingTime = store.AvgServeTime * (queuePosition - 1);
      callBack(waitingTime);
    });
  },

  // Returns position of user in UsersInQueue of store
  getQueuePosition: function(store, userId, callBack) {
    var queue = store.UsersInQueue, queuePosition = 1;
    queue.forEach(function(user) {
      if (userId === user.UserID) {
        return true;
      }
      queuePosition++;
    }
    callBack(queuePosition);
  },

  // Returns the waiting time for a store
  getWaitingTime(storeId, callBack) {
    database_call.getStoreInfo(storeId, function(store) {
      if(store.QueueLength){
        let waitingTime = store.AvgServeTime * store.QueueLength;
        callBack(waitingTime);
      }
      else callBack(0);
    });
  },

  // Same function as getWaitingTime except it utilizes promises and not callbacks
  getWaitingTimeAsync(storeId) {
    return new Promise(resolve => {
      this.getWaitingTime(storeId, resolve);
    }); 
  },

  // Adds waiting time to current time and returns in LTS format
  convertTimeToETA(waitingTime) {
    var now = moment();
    return moment(now)
      .add(waitingTime, "minutes")
      .format("LT");
  },

  // Converts minutes to ${hours}hours ${minutes}minutes
  convertToHours(num) {
    var hours = Math.floor(num / 60);
    var minutes = num % 60;
    if (hours) {
      if (minutes) return hours + " hrs " + minutes + " mins";
      else return hours + " hrs";
    } else {
      return minutes + " mins";
    }
  },

  // Given the store object and userId, returns waiting time
  getExpectedTimeEnrolledStore(store, userId, callBack) {
    var that = this;
    this.getQueuePosition(store, userId, function(queuePosition) {
      var waitingTime = store.AvgServeTime * (queuePosition - 1);
      callBack(that.convertTimeToETA(waitingTime));
    });
  },
};
