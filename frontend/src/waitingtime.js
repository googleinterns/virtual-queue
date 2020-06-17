import { database_call } from "./database.js";

export const waiting_time = {
  // Returns the expected waiting time for a user enrolled in the queue
  getWaitingTimeEnrolled(storeId, userId, callBack) {
    database_call.getAvgServeTime(storeId, function(avgServeTime) {
      database_call.getQueuePosition(storeId, userId, function(queuePosition) {
        let waitingTime = avgServeTime * (queuePosition - 1);
        callBack(waitingTime);
      });
    });
  },
};
