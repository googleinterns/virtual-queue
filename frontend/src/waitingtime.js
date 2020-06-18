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
    });
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
      if (minutes) return hours + " hours " + minutes + " minutes";
      else return hours + " hours";
    } else {
      return minutes + " minutes";
    }
  },
};
