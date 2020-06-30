import { database_call } from "./database.js";
const range = 20;
export const graph_call = {
  // this function returns the firstToken, lastToken and currentUserToken
  getTokenInfo: function(snap, currentUserId) {
    var firstTokenFlag = 0,
      firstToken = 0,
      lastToken = 0;
    var currentUserToken = null;
    snap.forEach(function(child) {
      var currentToken = child.child(database_call.getTokenIdField()).val();
      if (firstTokenFlag == 0) {
        // firstTokenflag = 0 detects we are on first token
        firstToken = currentToken;
        firstTokenFlag = 1;
      }
      if (currentUserId == child.child(database_call.getUserIdField()).val()) {
        currentUserToken = currentToken;
      }
      lastToken = currentToken;
    });
    return {
      firstToken: firstToken,
      lastToken: lastToken,
      currentUserToken: currentUserToken,
    };
  },

  // returns offset of graph
  getGraphOffset(firstToken) {
    var minMostToken = firstToken - ((firstToken - 1) % range);
    return (minMostToken - 1) / range;
  },

  // this function returns the (X,Y) plots for the graph
  getTokenDistributionArray: function(snap, firstToken, lastToken) {
    var tokenDistribution = [];
    var minMostToken = firstToken - ((firstToken - 1) % range);
    // initialising ranges in lineGraph array
    for (
      var lowerBound = minMostToken;
      lowerBound <= lastToken;
      lowerBound += range
    ) {
      var pair = [];
      var upperBound = lowerBound + range - 1;
      var key = lowerBound.toString() + "-" + upperBound.toString();
      pair.push(key);
      // pushing 100 to replicate it with percentage
      pair.push(100);
      tokenDistribution.push(pair);
    }
    // graphOffset shifts the origin of graph according to minMostToken
    var graphOffset = this.getGraphOffset(firstToken);

    // decrementing the people in a range who are not yet resolved
    snap.forEach(function(child) {
      var tokenId = child.child(database_call.getTokenIdField()).val();
      var index = Math.floor((tokenId - 1) / range) - graphOffset;
      // converting number of people into percentage of people resolved
      tokenDistribution[index][1] -= 100 / range;
    });
    return tokenDistribution;
  },

  // this function separates the X and Y coordinates of plots and put them into two different arrays
  getLineGraphArrays: function(snap, firstToken, lastToken) {
    var tokenDistributionArray = this.getTokenDistributionArray(
      snap,
      firstToken,
      lastToken
    );
    var lineGraphX = [],
      lineGraphY = [];
    // putting X and Y axis values in lineGraphX and lineGraphY arrays respectively except the last range
    for (var itr = 0; itr < tokenDistributionArray.length - 1; itr++) {
      lineGraphX.push(tokenDistributionArray[itr][0]);
      lineGraphY.push(tokenDistributionArray[itr][1]);
    }
    return { lineGraphX: lineGraphX, lineGraphY: lineGraphY };
  },

  // this function returns the index where plotline should be created
  getPlotLineIndex: function(currentUserToken, firstToken, lastToken) {
    // plotline will only be shown when user is logged in and entered in a queue and his token does not belong to last range
    if (
      currentUserToken != null &&
      currentUserToken <= Math.floor((lastToken - 1) / range) * range
    ) {
      var graphOffset = this.getGraphOffset(firstToken);
      return Math.floor(currentUserToken / range) - graphOffset;
    } else {
      return null;
    }
  },

  // this function returns subtitle for the graph
  getSubtitle: function(firstToken) {
    // subtitle will be shown if firstToken is greater than 1
    if (firstToken > 1) {
      return (
        "(People before token " + firstToken.toString() + " have been resolved)"
      );
    }
    return null;
  },

  // this function assigns the values to the various parameters of chart
  renderLineGraph: function(snap, currentUserId, chartOptions) {
    var { firstToken, lastToken, currentUserToken } = this.getTokenInfo(
      snap,
      currentUserId
    );
    var { lineGraphX, lineGraphY } = this.getLineGraphArrays(
      snap,
      firstToken,
      lastToken
    );
    // customizing Chart features
    chartOptions.series[0].data = lineGraphY;
    chartOptions.xAxis.categories = lineGraphX;
    chartOptions.subtitle.text = this.getSubtitle(firstToken);
    chartOptions.xAxis.plotLines[0].value = this.getPlotLineIndex(
      currentUserToken,
      firstToken,
      lastToken
    );
  },
};
