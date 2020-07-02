var assert = require('assert');
var firebase = require("firebase");
var database = require('./../src/database');
const { doesNotMatch } = require('assert');
 
// Initializing firebase
var firebaseConfig = {
  apiKey: "AIzaSyDw7U5UqRZeD4QAR7uumu-hsJt4pkuO5Ss",
  authDomain: "virtual-queue-testing.firebaseapp.com",
  databaseURL: "https://virtual-queue-testing.firebaseio.com",
  projectId: "virtual-queue-testing",
  storageBucket: "virtual-queue-testing.appspot.com",
  messagingSenderId: "982934985517",
  appId: "1:982934985517:web:574b2998607ebd5b4911a4"
};
firebase.initializeApp(firebaseConfig);

// testing addToQueue() method of database.js 
describe('Testing addToQueue()', function() {

  // Initializing database
  before(function(done){
    firebase.database().ref().set({
      "Store": {
        "1": {
          "CurrentToken": 1,
          "StoreName": "test",
        }
      }
    }, function(){
      done();
    })
  });

  // Clear database on completion of all the tests
  after(function(){
    return firebase.database().ref().remove();
  });

  describe('getTokenIdField', function(){
    it('should return database token', function () {
      assert.equal(database.database_call.getTokenIdField(), "Token")
    })
  })
  describe('read DB', function(){
    it('reading db', function () {
      return firebase.database().ref().once("value").then((snap)=>{
        console.log(snap.val());
        assert.equal(snap.val().Store["1"].StoreName, "test");
      });
    })
  })
  describe('addToQueue', function(){
    it('add to queue', function (done) {
      database.database_call.addToQueue("1", "1", ()=>{
        assert.equal("true", "true");
        done();
      });
      //assert.equal(database.database_call.isUserInQueue(), "false")
    })
  })
})