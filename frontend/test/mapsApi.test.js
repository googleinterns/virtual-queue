var assert = require("assert");
var mapsApi = require("./../src/mapsApi");

describe("mapsApi", function() {
  const defaultImage =
    "https://image.shutterstock.com/image-vector/dots-letter-c-logo-design-260nw-551769190.jpg";

  // checks if getImageUrl() returns a non default image for a store with photos field set
  describe("getImageUrl_storeWithImage_getMapsLink", function() {
    const store = {
      name: "Priya Grocery",
      photos: "CnRtAAAATLZNl354RwP_9UKbQ_5Psy40texXePv4oAlgP4qNEk",
    };
    it("should return a non default image", function() {
      assert.notEqual(mapsApi.maps_api.getImageUrl(store), defaultImage);
    });
  });

  // checks if getImageUrl() returns a default image for a store with photos field absent
  describe("getImageUrl_storeWithoutImage_getDefaultLink", function() {
    const store = {
      name: "Priya Grocery",
    };
    it("should return the default image", function() {
      assert.equal(mapsApi.maps_api.getImageUrl(store), defaultImage);
    });
  });
});
