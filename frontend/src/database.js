import firebase from "firebase";

const STORE_ID_STRING = "StoreID";
const USER_ID_STRING = "UserID";
const TOKEN_ID = "TokenId";

export const database_call = {
  // Returns the string "TOKEN_ID"
  getTokenIdField: function() {
    return TOKEN_ID;
  },

  // Returns the string "USER_ID_STRING"
  getUserIdField: function() {
    return USER_ID_STRING;
  },

  // Returns userId of currently loggged in user, returns null if user not logged in
  getUserId: function() {
    if (firebase.auth().currentUser) {
      return firebase.auth().currentUser.uid;
    } else {
      return null;
    }
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
          // Increment CurrentToken, if null set to 1
          if (currentStore.CurrentToken) {
            currentStore.CurrentToken = currentStore.CurrentToken + 1;
          } else {
            currentStore.CurrentToken = 1;
          }
          // Increment QueueLength, if null set to 1
          if (currentStore.QueueLength) {
            currentStore.QueueLength = currentStore.QueueLength + 1;
          } else {
            currentStore.QueueLength = 1;
          }
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
    var queueLengthRef = dbRef.child(this.getQueueLengthPath(storeId));
    queueLengthRef.transaction(
      function(queueLength) {
        return queueLength-1;
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
      var userInfo = {};
      userInfo.queuePosition = 1;
      snap.forEach(function(childSnap) {
        if (userId == childSnap.val().UserID) {
          userInfo.currentUserKey = childSnap.key;
          userInfo.tokenNumber = childSnap.val().Token;
          return true;
        }
        userInfo.queuePosition++;
      });
      callBack(userInfo);
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

  // Get the array of SubscribedStoreIDs of user
  getSubscribedStoreID: function(userId) {
    let dbRef = firebase.database().ref();
    return dbRef.child(this.getStorePath(userId)).once("value");
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
      if (snap.exists()) {
        store["IsEnabled"] = snap.val().IsEnabled;
        store["AvgServeTime"] = snap.val().AvgServeTime;
        store["QueueLength"] = snap.val().QueueLength;
        store["Address"] = snap.val().Address;
        store["Phone"] = snap.val().Phone;
        store["StoreName"] = snap.val().StoreName;
        callBack(store);
      }
    });
  },

  // Returns the entire store object
  getStoreObject: function(storeId) {
    let dbRef = firebase.database().ref();
    return dbRef.child("Store/" + storeId).once("value");
  },

  // Get path to IsEnabled of store with storeId
  getIsEnabledPath: function(storeId) {
    return `Store/${storeId}/IsEnabled`;
  },

  // Get path to QueueLength of store with storeId
  getQueueLengthPath: function(storeId) {
    return `Store/${storeId}/QueueLength`;
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

  // Logout current user
  logoutUser: function() {
    firebase.auth().signOut();
  },

  // Set listener to listen for changes in login state and return userId
  setLoginListener: function(callBack) {
    firebase.auth().onAuthStateChanged(function(userId) {
      callBack(userId);
    });
  },
};
