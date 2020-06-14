import firebase from "firebase";

export const database_call = {
    getQueuePosition: function(storeId, userId, callBack){
        //Pass a callBack function as an argument while calling this function, the callBack function has queuePosition as an argument
        let dbRef = firebase.database().ref();
        dbRef.child(this.getUserPath(storeId)).once("value", snap => {
            var queuePosition = 1;
            snap.forEach(function(childSnap){
                if(userId==childSnap.val().UserID){
                    return true;
                }
                queuePosition++;
            });
            callBack(queuePosition);
        });
    },
    getCurrentUserKey: function(storeId, userId, callBack){
        //Pass a callBack function as an argument while calling this function, the callBack function has queuePosition as an argument
        let dbRef = firebase.database().ref();
        dbRef.child(this.getUserPath(storeId)).orderByChild("UserID").equalTo(userId).once("value", snap => {
            var currentUserKey = null;
            if(snap.exists()){
                currentUserKey = Object.keys(snap.val())[0];
            }
            callBack(currentUserKey);
        });
    },
    getCurrentStoreKey: function(storeId, userId, callBack){
        //Pass a callBack function as an argument while calling this function, the callBack function has queuePosition as an argument
        let dbRef = firebase.database().ref();
        dbRef.child(this.getStorePath(userId)).orderByChild("StoreID").equalTo(storeId).once("value", snap =>{
            var currentStoreKey = null;
            if(snap.exists()){
                currentStoreKey = Object.keys(snap.val())[0];
            }
            callBack(currentStoreKey);
        });
    },
    getStorePath: function(userId){
        return `User/${userId}/SubscribedStoreID`;
    },
    getUserPath: function(storeId){
        return `Store/${storeId}/UsersInQueue`;
    }
}