var assert = require("assert");
var firebase = require("firebase");
var database = require("./../src/database");
require("dotenv").config({ path: __dirname + "/../.env" });
const { doesNotMatch } = require("assert");

// Initializing firebase
console.log(process.env.TEST_FIREBASE_PROJECT_ID);
var firebaseConfig = {
  apiKey: process.env.TEST_FIREBASE_API_KEY,
  authDomain: process.env.TEST_FIREBASE_PROJECT_ID + ".firebaseapp.com",
  databaseURL:
    "https://" + process.env.TEST_FIREBASE_PROJECT_ID + ".firebaseio.com",
  projectId: process.env.TEST_FIREBASE_PROJECT_ID,
  storageBucket: process.env.TEST_FIREBASE_PROJECT_ID + ".appspot.com",
  messagingSenderId: process.env.TEST_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.TEST_FIREBASE_APPID,
};
firebase.initializeApp(firebaseConfig);

// testing addToQueue() method of database.js
describe("database", function() {
  const VALID_STORE_ID = "1";
  const VALID_USER_ID = "1";
  const SECONDARY_USER_ID = "2";
  const STORE_NAME = "test";

  //Clearing this test results from database
  after(function() {
    return firebase
      .database()
      .ref()
      .remove();
  });

  /**
   * Test Conditions: storeId-exists, userIsEmpty, queueEmpty, CurrentToken-exists(=0), QueueLength-exists(=0)
   * Expected: QueueLength incremented,
   *           CurrentToken incremented,
   *           key: {UserID: userId, Token: token} added to UsersInQueue
   *           key: {StoreID: storeId} added to SubscribedStoreID
   */
  describe("addToQueue_storeIdExists_userIsEmpty_queueEmpty_currentTokenExists_queueLengthExists", function() {
    // Adding test conditions to database
    beforeEach(function(done) {
      firebase
        .database()
        .ref()
        .set(
          {
            Store: {
              "1": {
                StoreName: STORE_NAME,
                CurrentToken: 0,
                QueueLength: 0,
              },
            },
          },
          function() {
            done();
          }
        );
    });

    it("added to queue", function(done) {
      database.database_call.addToQueue(VALID_STORE_ID, VALID_USER_ID, () => {
        firebase
          .database()
          .ref()
          .once("value", function(snap) {
            var QueueLength = snap.val().Store[VALID_STORE_ID].QueueLength;
            var CurrentToken = snap.val().Store[VALID_STORE_ID].CurrentToken;

            // Expected: QueueLength incremented
            assert.equal(QueueLength, 1);

            // Expected: CurrentToken incremented
            assert.equal(CurrentToken, 1);

            var UsersInQueue = snap.val().Store[VALID_STORE_ID].UsersInQueue;
            // Expected: Only one user in queue
            var numUsers = Object.keys(UsersInQueue).length;
            assert.equal(numUsers, 1);

            // Expected: key: {UserID: userId, Token: token} added to UsersInQueue
            var userKey = Object.keys(UsersInQueue)[0];
            assert.equal(UsersInQueue[userKey].UserID, VALID_USER_ID);

            var SubscribedStoreID = snap.val().User[VALID_USER_ID]
              .SubscribedStoreID;
            // Expected: Only one store in SubscribedStoreID
            var numUsers = Object.keys(SubscribedStoreID).length;
            assert.equal(numUsers, 1);

            // Expected: key: {StoreID: storeId} added to SubscribedStoreID
            var storeKey = Object.keys(SubscribedStoreID)[0];
            assert.equal(SubscribedStoreID[storeKey].StoreID, VALID_STORE_ID);

            done();
          });
      });
    });
  });

  /**
   * Test Conditions: storeId-exists, userIsEmpty, queueNotEmpty, CurrentToken-exists(=1), QueueLength-exists(=1)
   * Expected: QueueLength incremented,
   *           CurrentToken incremented,
   *           key: {UserID: userId, Token: token} added to UsersInQueue
   *           key: {StoreID: storeId} added to SubscribedStoreID
   */
  describe("addToQueue_storeIdExists_userIsEmpty_queueNotEmpty_currentTokenExists_queueLengthExists", function() {
    // Adding test conditions to database
    beforeEach(function(done) {
      firebase
        .database()
        .ref()
        .update(
          {
            Store: null,
            User: null,
          },
          function() {
            firebase
              .database()
              .ref()
              .set(
                {
                  Store: {
                    "1": {
                      StoreName: STORE_NAME,
                      CurrentToken: 1,
                      QueueLength: 1,
                      UsersInQueue: {
                        "-1": {
                          UserID: SECONDARY_USER_ID,
                          Token: 1,
                        },
                      },
                    },
                  },
                  User: {
                    "2": {
                      SubscribedStoreID: {
                        "-1": {
                          StoreID: "1",
                        },
                      },
                    },
                  },
                },
                function() {
                  done();
                }
              );
          }
        );
    });

    it("added to queue", function(done) {
      database.database_call.addToQueue(VALID_STORE_ID, VALID_USER_ID, () => {
        firebase
          .database()
          .ref()
          .once("value", function(snap) {
            var QueueLength = snap.val().Store[VALID_STORE_ID].QueueLength;
            var CurrentToken = snap.val().Store[VALID_STORE_ID].CurrentToken;

            // Expected: QueueLength incremented to 2
            assert.equal(QueueLength, 2);

            // Expected: CurrentToken incremented to 2
            assert.equal(CurrentToken, 2);

            var UsersInQueue = snap.val().Store[VALID_STORE_ID].UsersInQueue;
            // Expected: Two users in queue
            var numUsers = Object.keys(UsersInQueue).length;
            assert.equal(numUsers, 2);

            // Expected: key: {UserID: userId, Token: token} added to UsersInQueue
            var userKey = Object.keys(UsersInQueue)[1];
            assert.equal(UsersInQueue[userKey].UserID, VALID_USER_ID);

            var SubscribedStoreID = snap.val().User[VALID_USER_ID]
              .SubscribedStoreID;
            // Expected: Only one store in SubscribedStoreID
            var numUsers = Object.keys(SubscribedStoreID).length;
            assert.equal(numUsers, 1);

            // Expected: key: {StoreID: storeId} added to SubscribedStoreID
            var storeKey = Object.keys(SubscribedStoreID)[0];
            assert.equal(SubscribedStoreID[storeKey].StoreID, VALID_STORE_ID);

            done();
          });
      });
    });
  });

  /**
   * Test Conditions: storeId-exists, userIsEmpty, queueEmpty, CurrentToken does notexist, QueueLength-exists(=1)
   * Expected: QueueLength incremented,
   *           CurrentToken is 1,
   *           key: {UserID: userId, Token: token} added to UsersInQueue
   *           key: {StoreID: storeId} added to SubscribedStoreID
   */
  describe("addToQueue_storeIdExists_userIsEmpty_queueIsEmpty_currentTokenDoesNotExist_queueLengthExists", function() {
    // Adding test conditions to database
    beforeEach(function(done) {
      firebase
        .database()
        .ref()
        .set(
          {
            Store: {
              "1": {
                StoreName: STORE_NAME,
                QueueLength: 0,
              },
            },
          },
          function() {
            done();
          }
        );
    });

    it("added to queue", function(done) {
      database.database_call.addToQueue(VALID_STORE_ID, VALID_USER_ID, () => {
        firebase
          .database()
          .ref()
          .once("value", function(snap) {
            var QueueLength = snap.val().Store[VALID_STORE_ID].QueueLength;
            var CurrentToken = snap.val().Store[VALID_STORE_ID].CurrentToken;

            // Expected: QueueLength incremented to 1
            assert.equal(QueueLength, 1);

            // Expected: CurrentToken created and set to 1
            assert.equal(CurrentToken, 1);

            var UsersInQueue = snap.val().Store[VALID_STORE_ID].UsersInQueue;
            // Expected: Two users in queue
            var numUsers = Object.keys(UsersInQueue).length;
            assert.equal(numUsers, 1);

            // Expected: key: {UserID: userId, Token: token} added to UsersInQueue
            var userKey = Object.keys(UsersInQueue)[0];
            assert.equal(UsersInQueue[userKey].UserID, VALID_USER_ID);

            var SubscribedStoreID = snap.val().User[VALID_USER_ID]
              .SubscribedStoreID;
            // Expected: Only one store in SubscribedStoreID
            var numUsers = Object.keys(SubscribedStoreID).length;
            assert.equal(numUsers, 1);

            // Expected: key: {StoreID: storeId} added to SubscribedStoreID
            var storeKey = Object.keys(SubscribedStoreID)[0];
            assert.equal(SubscribedStoreID[storeKey].StoreID, VALID_STORE_ID);

            done();
          });
      });
    });
  });

  /**
   * Test Conditions: storeId-exists, userIsEmpty, queueEmpty, CurrentToken-exists(=0), QueueLength does not exist
   * Expected: QueueLength is 1,
   *           CurrentToken incremented,
   *           key: {UserID: userId, Token: token} added to UsersInQueue
   *           key: {StoreID: storeId} added to SubscribedStoreID
   */
  describe("addToQueue_storeIdExists_userIsEmpty_queueIsEmpty_currentTokenExists_queueLengthDoesNotExist", function() {
    // Adding test conditions to database
    beforeEach(function(done) {
      firebase
        .database()
        .ref()
        .set(
          {
            Store: {
              "1": {
                StoreName: STORE_NAME,
                CurrentToken: 0,
              },
            },
          },
          function() {
            done();
          }
        );
    });

    it("added to queue", function(done) {
      database.database_call.addToQueue(VALID_STORE_ID, VALID_USER_ID, () => {
        firebase
          .database()
          .ref()
          .once("value", function(snap) {
            var QueueLength = snap.val().Store[VALID_STORE_ID].QueueLength;
            var CurrentToken = snap.val().Store[VALID_STORE_ID].CurrentToken;

            // Expected: QueueLength created and set to 1
            assert.equal(QueueLength, 1);

            // Expected: CurrentToken incremented to 1
            assert.equal(CurrentToken, 1);

            var UsersInQueue = snap.val().Store[VALID_STORE_ID].UsersInQueue;
            // Expected: Two users in queue
            var numUsers = Object.keys(UsersInQueue).length;
            assert.equal(numUsers, 1);

            // Expected: key: {UserID: userId, Token: token} added to UsersInQueue
            var userKey = Object.keys(UsersInQueue)[0];
            assert.equal(UsersInQueue[userKey].UserID, VALID_USER_ID);

            var SubscribedStoreID = snap.val().User[VALID_USER_ID]
              .SubscribedStoreID;
            // Expected: Only one store in SubscribedStoreID
            var numUsers = Object.keys(SubscribedStoreID).length;
            assert.equal(numUsers, 1);

            // Expected: key: {StoreID: storeId} added to SubscribedStoreID
            var storeKey = Object.keys(SubscribedStoreID)[0];
            assert.equal(SubscribedStoreID[storeKey].StoreID, VALID_STORE_ID);

            done();
          });
      });
    });
  });

  /**
   * Test Conditions: storeId-exists, userIsEmpty, queueEmpty, CurrentToken does not exist, QueueLength does not exist
   * Expected: QueueLength is 1,
   *           CurrentToken incremented,
   *           key: {UserID: userId, Token: token} added to UsersInQueue
   *           key: {StoreID: storeId} added to SubscribedStoreID
   */
  describe("addToQueue_storeIdExists_userIsEmpty_queueIsEmpty_currentTokenDoesNotExist_queueLengthDoesNotExist", function() {
    // Adding test conditions to database
    beforeEach(function(done) {
      firebase
        .database()
        .ref()
        .set(
          {
            Store: {
              "1": {
                StoreName: STORE_NAME,
              },
            },
          },
          function() {
            done();
          }
        );
    });

    it("added to queue", function(done) {
      database.database_call.addToQueue(VALID_STORE_ID, VALID_USER_ID, () => {
        firebase
          .database()
          .ref()
          .once("value", function(snap) {
            var QueueLength = snap.val().Store[VALID_STORE_ID].QueueLength;
            var CurrentToken = snap.val().Store[VALID_STORE_ID].CurrentToken;

            // Expected: QueueLength created and set to 1
            assert.equal(QueueLength, 1);

            // Expected: CurrentToken created and set to 1
            assert.equal(CurrentToken, 1);

            var UsersInQueue = snap.val().Store[VALID_STORE_ID].UsersInQueue;
            // Expected: Two users in queue
            var numUsers = Object.keys(UsersInQueue).length;
            assert.equal(numUsers, 1);

            // Expected: key: {UserID: userId, Token: token} added to UsersInQueue
            var userKey = Object.keys(UsersInQueue)[0];
            assert.equal(UsersInQueue[userKey].UserID, VALID_USER_ID);

            var SubscribedStoreID = snap.val().User[VALID_USER_ID]
              .SubscribedStoreID;
            // Expected: Only one store in SubscribedStoreID
            var numUsers = Object.keys(SubscribedStoreID).length;
            assert.equal(numUsers, 1);

            // Expected: key: {StoreID: storeId} added to SubscribedStoreID
            var storeKey = Object.keys(SubscribedStoreID)[0];
            assert.equal(SubscribedStoreID[storeKey].StoreID, VALID_STORE_ID);

            done();
          });
      });
    });
  });
});
