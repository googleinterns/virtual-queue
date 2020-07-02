var assert = require("assert");
var search = require("./../src/search");

describe("search", function() {
  // Function to check if array is sorted
  function isQueueArraySorted(queues) {
    for (var i = 0; i < queues.length - 1; i++) {
      var aServeTime = Math.max(queues[i].travelTime, queues[i].waitingTime);
      var bServeTime = Math.max(queues[i].travelTime, queues[i].waitingTime);
      // Checks if serveTime of an element is not greater than the next element
      if (aServeTime > bServeTime) return false;
    }
    return true;
  }

  // Checks if sortStoresArray() returns a sorted array for an input of stores where each has same wait & travel times
  describe("sortStoresArray_sameWaitAndTravelTime_getSortedOutput", function() {
    let input = [
      { waitingTime: 16, travelTime: 16 },
      { waitingTime: 24, travelTime: 24 },
      { waitingTime: 42, travelTime: 42 },
      { waitingTime: 8, travelTime: 8 },
    ];

    let output = search.search_api.sortStoresArray(input);
    it("should return a sorted array", function() {
      assert.equal(isQueueArraySorted(output), true);
    });
  });

  // Checks if sortStoresArray() returns a sorted array for an input of stores with random wait & travel times
  describe("sortStoresArray_diffWaitAndTravelTime_getSortedArray", function() {
    let input = [
      { waitingTime: 16, travelTime: 92 },
      { waitingTime: 24, travelTime: 6 },
      { waitingTime: 42, travelTime: 40 },
      { waitingTime: 8, travelTime: 6 },
    ];

    let output = search.search_api.sortStoresArray(input);
    it("should return a sorted array", function() {
      assert.equal(isQueueArraySorted(output), true);
    });
  });

  // Checks if sortStoresArray() returns a sorted array for an input of stores with decimal values of wait & travel times
  describe("sortStoresArray_decimalTimeValues_getSortedArray", function() {
    let input = [
      { waitingTime: 16.2, travelTime: 13.6 },
      { waitingTime: 24.5, travelTime: 6.7 },
      { waitingTime: 42.1, travelTime: 40.78 },
      { waitingTime: 8.8, travelTime: 63.4 },
    ];

    let output = search.search_api.sortStoresArray(input);
    it("should return a sorted array", function() {
      assert.equal(isQueueArraySorted(output), true);
    });
  });

  // Checks if sortStoresArray() returns an array with all stores present
  describe("sortStoresArray_storesWithPlaceIds_allIdsPresent", function() {
    let input = [
      { id: "id1", waitingTime: 16, travelTime: 16 },
      { id: "id2", waitingTime: 24, travelTime: 24 },
      { id: "id4", waitingTime: 42, travelTime: 42 },
      { id: "id7", waitingTime: 8, travelTime: 8 },
    ];

    let output = search.search_api.sortStoresArray(input);

    var idPresenceCheck = {};

    for (var i = 0; i < input.length; i++) {
      idPresenceCheck[input[i].id] = false;
    }
    // Iterates over place IDs
    for (var key in idPresenceCheck) {
      // Iterates over all Output stores
      for (var j = 0; j < output.length; j++) {
        // If place ID in input array is found in output array, its check is set to true
        if (output[j].id == key) idPresenceCheck[key] = true;
      }
    }

    allIdsPresentflag = true;
    // Checks if each place ID is present in output and updates the allIdsPresent flag accordingly
    for (key in idPresenceCheck) {
      if (!idPresenceCheck[key]) allIdsPresentflag = false;
    }

    it("all stores must be present in output", function() {
      assert.equal(allIdsPresentflag, true);
    });
  });
});
