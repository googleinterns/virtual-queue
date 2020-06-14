import firebase from "firebase";
import { database_call } from "./database.js";

export const waiting_time = {
    getWaitingTime(storeId, userId, callBack){
        //If userId is null, this function returns queueLength * avgServeTime
        //Else it returns (queuePosition-1) * avgServeTime
        let dbRef = firebase.database().ref();
        dbRef.child("Store/" + storeId).once("value", store => {
            let avgServeTime = store.val().AvgServeTime;
            database_call.getQueuePosition(storeId, userId, function(queuePosition){
                let waitingTime = null;
                if(userId==null){
                    waitingTime = avgServeTime * queuePosition;
                }
                else{
                    waitingTime = avgServeTime * (queuePosition-1);
                }
                callBack(waitingTime);
            });
        });
    }
}