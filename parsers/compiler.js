/* jshint node: true */
'use strict';

module.exports = function(textRegexes) {
  var regexes = [];
  var reStreetCleaner = /^\^?(.*)\,?\$?$/;
  var ii;

  for (ii = textRegexes.length; ii--; ) {
      regexes[ii] = [textRegexes[ii][0], new RegExp(
        textRegexes[ii][1].replace(reStreetCleaner, '^$1\,?$'),
        'i'
      )];
  } // for

  return regexes;
};