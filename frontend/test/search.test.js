var assert = require("assert");
var search = require("./../src/search");

describe("#sortStoresArray", () => {
  describe("Passing test for already sorted array with same integer values of wait & travel time", () => {
    const input = [
      { waitTime: 8, travelTime: 8 },
      { waitTime: 16, travelTime: 16 },
      { waitTime: 24, travelTime: 24 },
      { waitTime: 42, travelTime: 42 },
    ];
    expect(search.sortStoresArray(input)).toEqual(input);
  });

  test("Failing test for unsorted array with same integer values of wait & travel time", () => {
    const input = [
      { waitTime: 16, travelTime: 16 },
      { waitTime: 24, travelTime: 24 },
      { waitTime: 42, travelTime: 42 },
      { waitTime: 8, travelTime: 8 },
    ];
    expect(search.sortStoresArray(input)).not.toBe(input);
  });
});
