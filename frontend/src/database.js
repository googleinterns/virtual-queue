import firebase from "firebase";

const STORE_ID_STRING = "StoreID";
const USER_ID_STRING = "UserID";
const TOKEN_ID = "TokenId";

export const database_call = {
  getTokenIdField: function() {
    return TOKEN_ID;
  },

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

  // Increments the CurrentToken and QueueLength of the store and returns the value of CurrentToken to the callBack function
  getToken: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    var currentStoreRef = dbRef.child("Store/" + storeId);
    currentStoreRef.transaction(
      function(currentStore) {
        if (currentStore) {
          currentStore.CurrentToken++;
          currentStore.QueueLength++;
        }
        return currentStore;
      },
      function(error, committed, store) {
        if (error) {
          console.log(error);
        } else if (!committed) {
          console.log("Commit error: No data is returned");
        } else {
          callBack(store.val().CurrentToken);
        }
      }
    );
  },

  // Add user to store and returns: currentUserKey, currentStoreKey, token, error
  addToQueue: function(storeId, userId, callBack) {
    let dbRef = firebase.database().ref();
    var that = this;
    // Retrieve CurrentToken
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
        Token: token,
      };
      updateQueue[that.getStorePath(userId) + "/" + currentStoreKey] = {
        StoreID: storeId,
      };

      // This is a multi-path write and both updates happen in a transaction
      dbRef.update(updateQueue, function(error) {
        callBack(currentStoreKey, currentUserKey, token, error);
      });
    });
  },

  decQueueLength: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    var queueLengthRef = dbRef.child("Store/" + storeId);
    queueLengthRef.transaction(
      function(queueLength) {
        return queueLength--;
      },
      function(error, committed) {
        if (error) {
          console.log(error);
        } else if (!committed) {
          console.log("Commit error: No data is returned");
        } else {
          callBack();
        }
      }
    );
  },

  removeFromQueue: function(storeId, userId, storeKey, userKey, callBack) {
    let dbRef = firebase.database().ref();
    var that = this;

    this.decQueueLength(storeId, function() {
      var updateQueue = {};
      // Remove User from UsersInQueue
      updateQueue[that.getUserPath(storeId) + "/" + userKey] = {
        UserID: null,
        Token: null,
      };

      // Remove Store from SubscribedStoreID
      updateQueue[that.getStorePath(userId) + "/" + storeKey] = {
        StoreID: null,
      };

      // Both updates happen in a transaction
      dbRef.update(updateQueue, function(error) {
        callBack(error);
      });
    });
  },

  // Returns the queuePosition, currentUserKey (of the user in UsersInQueue), and tokenNumber
  getUserInfo: function(storeId, userId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child(this.getUserPath(storeId)).once("value", (snap) => {
      var queuePosition = 1,
        currentUserKey = null,
        tokenNumber = null;
      snap.forEach(function(childSnap) {
        if (userId == childSnap.val().UserID) {
          currentUserKey = childSnap.key;
          tokenNumber = childSnap.val().Token;
          return true;
        }
        queuePosition++;
      });
      callBack(queuePosition, currentUserKey, tokenNumber);
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

  // Get the array of OwnedStoreIDs of user
  getOwnedStoreID: function(userId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child(this.getOwnedStoreIDPath(userId)).once("value", (snap) => {
      let storeIds = [];
      snap.forEach(function(childSnap) {
        storeIds.push(childSnap.val().StoreID);
      });
      callBack(storeIds);
    });
  },

  // Set IsEnabled value of store
  toggleQueue: function(storeId, isEnabled, callBack) {
    var storeRef = firebase
      .database()
      .ref()
      .child(this.getIsEnabledPath(storeId));
    storeRef.set(isEnabled);
    callBack();
  },

  // Get StoreName, IsEnabled, AvgServeTime and QueueLength info of store
  // Returns an object with fields StoreName, IsEnabled, AvgServeTime and QueueLength
  getStoreInfo: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child("Store/" + storeId).once("value", (snap) => {
      var store = {};
      store["StoreName"] = snap.val().StoreName;
      store["IsEnabled"] = snap.val().IsEnabled;
      store["AvgServeTime"] = snap.val().AvgServeTime;
      store["QueueLength"] = snap.val().QueueLength;
      callBack(store);
    });
  },

  // Returns the entire store object
  getStoreObject: function(storeId, callBack){
    let dbRef = firebase.database().ref();
    dbRef.child("Store/" + storeId).once("value", (store) => {
      callBack(store);
    });
  },

  // Get path to IsEnabled of store with storeId
  getIsEnabledPath: function(storeId) {
    return `Store/${storeId}/IsEnabled`;
  },

  // Get path to OwnedStoreID child of user with userId
  getOwnedStoreIDPath: function(userId) {
    return `User/${userId}/OwnedStoreID`;
  },

  // Get path to SubscribedStoreID child of user with userId
  getStorePath: function(userId) {
    return `User/${userId}/SubscribedStoreID`;
  },

  // Get path to UsersInQueue of store with storeId
  getUserPath: function(storeId) {
    return `Store/${storeId}/UsersInQueue`;
  },

  // Get path to CurrentToken of store
  getTokenPath: function(storeId) {
    return `Store/${storeId}/CurrentToken`;
  },

  // Set listener on UsersinQueue and listen for addition to queue
  // https://firebase.google.com/docs/database/web/lists-of-data
  // This event is triggered once for each existing child and then again every time a new child is added.
  setQueueIncListener: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child(this.getUserPath(storeId)).on("child_added", callBack);
  },

  // Set listener on UsersinQueue and listen for deletion from queue
  setQueueDecListener: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child(this.getUserPath(storeId)).on("child_removed", callBack);
  },

  // Set listener on UsersinQueue to listen to any change in queue
  setPowerCurveListener: function(storeId, callBack) {
    let dbRef = firebase.database().ref();
    dbRef.child(this.getUserPath(storeId)).on("value", callBack);
  },
};
