import firebase from "firebase";

const STORE_ID_STRING = "StoreID";
const USER_ID_STRING = "UserID";

export const database_call = {
  // Returns userId of currently loggged in user
  getUserId: function() {
    return firebase.auth().currentUser.uid;
  },

  // Returns whether user with userId is enrolled in store with storeId
  isUserInQueue: function(storeId, userId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef
      .child(this.getStorePath(userId))
      .orderByChild(STORE_ID_STRING)
      .equalTo(storeId)
      .once("value", (snap) => {
        if (snap.exists()) {
          callBack(true);
        } else {
          callBack(false);
        }
      });
  },

  getToken: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    var currentTokenRef = dbRef.child("Store/" + storeId + "/CurrentToken");
    currentTokenRef.transaction(
      function(currentToken) {
        return currentToken + 1;
      },
      function(error, committed, token) {
        if (error) {
          console.log(error);
        } else if (!committed) {
          console.log("Commit error: No data is returned");
        } else {
          callBack(token.val());
        }
      }
    );
  },

  // Add user to store and returns: currentUserKey, currentStoreKey, error
  addToQueue: function(storeId, userId, callBack) {
    let dbRef = firebase.database().ref();
    var that = this;
    this.getToken(storeId, function(token) {
      // Enter User to UsersInQueue
      var currentUserRef = dbRef.child(that.getUserPath(storeId)).push();
      var currentUserKey = currentUserRef.key;

      // Enter Store to SubscribedStoreID
      var currentStoreRef = dbRef.child(that.getStorePath(userId)).push();
      var currentStoreKey = currentStoreRef.key;

      var updateQueue = {};
      updateQueue[that.getUserPath(storeId) + "/" + currentUserKey] = {
        UserID: userId,
      };
      updateQueue[that.getStorePath(userId) + "/" + currentStoreKey] = {
        StoreID: storeId,
      };

      dbRef.update(updateQueue, function(error) {
        callBack(currentStoreKey, currentUserKey, error);
      });
    });
  },

  removeFromQueue: function(storeId, userId, storeKey, userKey, callBack) {
    let dbRef = firebase.database().ref();

    var updateQueue = {};
    // Remove User from UsersInQueue
    updateQueue[this.getUserPath(storeId) + "/" + userKey] = {
      UserID: null,
    };

    // Remove Store from SubscribedStoreID
    updateQueue[this.getStorePath(userId) + "/" + storeKey] = {
      StoreID: null,
    };

    // Both updates happen in a transaction
    dbRef.update(updateQueue, function(error) {
      callBack(error);
    });
  },

  // Pass a callBack function as an argument while calling this function, the callBack function has queuePosition as an argument
  // If userId is null, function returns queueLength
  getQueuePosition: function(storeId, userId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child(this.getUserPath(storeId)).once("value", (snap) => {
      var queuePosition = 1;
      snap.forEach(function(childSnap) {
        if (userId == childSnap.val().UserID) {
          return true;
        }
        queuePosition++;
      });
      callBack(queuePosition);
    });
  },

  // Pass a callBack function as an argument while calling this function, the callBack function has queuePosition as an argument
  getCurrentUserKey: function(storeId, userId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef
      .child(this.getUserPath(storeId))
      .orderByChild(USER_ID_STRING)
      .equalTo(userId)
      .once("value", (snap) => {
        var currentUserKey = null;
        if (snap.exists()) {
          currentUserKey = Object.keys(snap.val())[0];
        }
        callBack(currentUserKey);
      });
  },

  // Pass a callBack function as an argument while calling this function, the callBack function has queuePosition as an argument
  getCurrentStoreKey: function(storeId, userId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef
      .child(this.getStorePath(userId))
      .orderByChild(STORE_ID_STRING)
      .equalTo(storeId)
      .once("value", (snap) => {
        var currentStoreKey = null;
        if (snap.exists()) {
          currentStoreKey = Object.keys(snap.val())[0];
        }
        callBack(currentStoreKey);
      });
  },

  // Get path to SubscribedStoreID child of user with userId
  getStorePath: function(userId) {
    return `User/${userId}/SubscribedStoreID`;
  },

  // Get path to UsersInQueue of store with storeId
  getUserPath: function(storeId) {
    return `Store/${storeId}/UsersInQueue`;
  },

  // Set listener on UsersinQueue and listen for addition to queue
  setQueueIncListener: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child(this.getUserPath(storeId)).on("child_added", callBack);
  },

  // Set listener on UsersinQueue and listen for deletion from queue
  setQueueDecListener: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child(this.getUserPath(storeId)).on("child_removed", callBack);
  },
};
