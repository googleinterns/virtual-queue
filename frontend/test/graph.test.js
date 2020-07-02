var assert = require("assert");
var graph = require("./../src/graph");

describe("Graph", function() {
  describe("getSubtitle_passFirstTokenOtherThanOne_returnSubtitle", function() {
    it("should return the subtitle", function() {
      assert.equal(
        graph.graph_call.getSubtitle(10),
        "(People before token 10 have been resolved)"
      );
    });
  });
  describe("getSubtitle_passOneAsFirstToken_returnNull", function() {
    it("should return the subtitle", function() {
      assert.equal(graph.graph_call.getSubtitle(1), null);
    });
  });
  describe("getGraphOffset_passAnyFirstToken_returnOffset", function() {
    it("should return the offset", function() {
      assert.equal(graph.graph_call.getGraphOffset(78), 3);
    });
  });
  describe("getGraphOffset_passFirstTokenAsOne_returnOffset", function() {
    it("should return the offset", function() {
      assert.equal(graph.graph_call.getGraphOffset(1), 0);
    });
  });
  describe("getPlotLineIndex_passingTokenNotPresentInLastRange_returnIndexOfPlotLine", function() {
    it("should return the index where plotline will be shown", function() {
      assert.equal(graph.graph_call.getPlotLineIndex(4, 1, 50), 0);
    });
  });
  describe("getPlotLineIndex_passingTokenPresentInLastRange_returnNull", function() {
    it("should return the index where plotline will be shown", function() {
      assert.equal(graph.graph_call.getPlotLineIndex(49, 1, 50), null);
    });
  });
});
