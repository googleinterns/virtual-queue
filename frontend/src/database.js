import firebase from "firebase";

export const database_call = {
        getQueuePosition: function(storeId, userId, callBack){
            console.log("getQueuePosition");
            let dbRef = firebase.database().ref();
            dbRef.child(this.getUserPath(storeId)).once("value", snap => {
                console.log("Inside getQueuePosition");
                var count = 1;
                snap.forEach(function(childSnap){
                    if(userId==childSnap.val().UserId){
                        console.log(count);
                        return true;
                    }
                    count++;
                });
                callBack(count);
            });
        },
        getCurrentUserKey: function(storeId, userId, callBack){
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