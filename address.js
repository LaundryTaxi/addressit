/* jshint node: true */
'use strict';

var reNumeric = /^\d+$/;

/**
  ### Address
**/
function Address(text, opts) {
  if (! (this instanceof Address)) {
    return new Address(text);
  }

  this.text = text;
  this.parts = [];
}

module.exports = Address;
var proto = Address.prototype;


/**
  #### Address#_extractStreetParts(startIndex)

  This function is used to extract from the street type match
  index *back to* the street number and possibly unit number fields.

  The function will start with the street type, then also grab the previous
  field regardless of checks.  Fields will continue to be pulled in until
  fields start satisfying numeric checks.  Once positive numeric checks are
  firing, those will be brought in as building / unit numbers and once the
  start of the parts array is reached or we fall back to non-numeric fields
  then the extraction is stopped.
**/
proto._extractStreetParts = function(indx) {
  var index = indx;
  var streetParts = [];
  var numberParts;
  var parts = this.parts;
  var testFn = function() {
    return true;
  };

  while (index >= 0 && testFn()) {
    var alphaPart = isNaN(parseInt(parts[index], 10));

    if (streetParts.length < 1 || alphaPart) {
      // add the current part to the street parts
      streetParts.unshift(parts.splice(index--, 1));
    }
    else {
      if (! numberParts) {
        numberParts = [];
      } // if

      // add the current part to the building parts
      numberParts.unshift(parts.splice(index--, 1));

      // update the test function
      testFn = function() {
        var isAlpha = isNaN(parseInt(parts[index], 10));

        // if we have building parts, then we are looking
        // for non-alpha values, otherwise alpha
        return numberParts ? (! isAlpha) : isAlpha;
      };
    } // if..else
  } // while

  this.number = numberParts ? numberParts.join('/') : '';
  this.street = streetParts.join(' ').replace(/\,/g, '');

  // parse the number as an integer
  this.number = reNumeric.test(this.number) ? parseInt(this.number, 10) : this.number;
};

/**
  #### Address#clean

  The clean function is used to clean up an address string.  It is designed
  to remove any parts of the text that preven effective parsing of the
  address string.
**/
proto.clean = function(cleaners) {
  // ensure we have cleaners
  cleaners = cleaners || [];

  // apply the cleaners
  for (var ii = 0; ii < cleaners.length; ii++) {
    if (typeof cleaners[ii] == 'function') {
      this.text = cleaners[ii].call(null, this.text);
    }
    else if (cleaners[ii] instanceof RegExp) {
      this.text = this.text.replace(cleaners[ii], '');
    }
  } // for

  return this;
};

/**
  #### Address#extract(fieldName, regexes)

  The extract function is used to extract the specified field from the raw
  parts that have previously been split from the input text.  If successfully
  located then the field will be updated from the parts and that part removed
  from the parts list.
**/
proto.extract = function(fieldName, regexes, opts) {
  var match;
  var rgxIdx;
  var ii;
  var value;
  var lookups = [];
  var options = opts || {};

  var breakout = options['breakout'] || false;
  var sideness = options['sideness'] || 'none';

  var self = this;

  // if the regexes have been passed in as objects, then convert to an array
  if (typeof regexes == 'object' && typeof regexes.splice == 'undefined') {
    var newRegexes = [];

    // iterate through the keys in the regexes
    for (var key in regexes) {
      newRegexes[newRegexes.length] = regexes[key];
      lookups[newRegexes.length - 1] = key;
    }

    // update the regexes to point to the new regexes
    regexes = newRegexes;
  }

  // iterate over the unit regexes and test them against the various parts
  var finder = function () {

    for (rgxIdx = 0; rgxIdx < regexes.length; rgxIdx++) {
      for (ii = self.parts.length; ii--;) {
        match = regexes[rgxIdx].exec(self.parts[ii]);

        // if we have a match, then process
        if (match) {
          // if we have a 2nd capture group, then replace the item with
          // the text of that group
          /*if (match[2]) {
           this.parts.splice(ii, 1, match[2]);
           }
           // otherwise, just remove the element
           else {
           this.parts.splice(ii, 1);
           }*/ // if..else
          self.parts.splice(ii, 1);
          value = lookups[rgxIdx] || match[1];

          if(sideness && sideness === 'left'){

          }
          else if(sideness && sideness === 'right'){
            self[fieldName + 'Post'] = self.parts.splice(ii);
          }


          if (breakout && breakout === true) return;
        } // if
      } // for
    } // for
  }
  finder();
  // update the field value
  this[fieldName] = parseInt(value, 10) || value;

  return this;
};

/**
  #### Address#extractStreet

  This function is used to parse the address parts and locate any parts
  that look to be related to a street address.
**/
proto.extractStreet = function(regexes, reSplitStreet) {
  var reNumericesque = /^(\d*|\d*\w)$/;
  var parts = this.parts;

  // ensure we have regexes
  regexes = regexes || [];

  // This function is used to locate the "best" street part in an address
  // string.  It is called once a street regex has matched against a part
  // starting from the last part and working towards the front. In terms of
  // what is considered the best, we are looking for the part closest to the
  // start of the string that is not immediately prefixed by a numericesque
  // part (eg. 123, 42A, etc).
  function locateBestStreetPart(startIndex) {
    var bestIndex = startIndex;

    // if the start index is less than or equal to 0, then return
    for (var ii = startIndex-1; ii >= 0; ii--) {
      // iterate over the street regexes and test them against the various parts
      for (var rgxIdx = 0; rgxIdx < regexes.length; rgxIdx++) {
        // if we have a match, then process
        if (regexes[rgxIdx][1].test(parts[ii]) && parts[ii-1] && (! reNumericesque.test(parts[ii-1]))) {
          // update the best index and break from the inner loop
          bestIndex = ii;
          break;
        } // if
      } // for
    } // for

    return bestIndex;
  } // locateBestStreetPart

  // iterate over the street regexes and test them against the various parts
  for (var partIdx = parts.length; partIdx--; ) {
  
  // 
    for (var rgxIdx = 0; rgxIdx < regexes.length; rgxIdx++) {
      // if we have a match, then process
      // if the match is on the first part though, reject it as we
      // are probably dealing with a town name or something (e.g. St George)
      if (regexes[rgxIdx][1].test(parts[partIdx]) && partIdx > 0) {
        var startIndex = partIdx; //locateBestStreetPart(partIdx);
        this['streetType'] = regexes[rgxIdx][0] || parts[partIdx];
        this.parts.splice(startIndex--);
        // if we are dealing with a split street (i.e. foo rd west) and the
        // address parts are appropriately delimited, then grab the next part
        // also

        /*if (reSplitStreet.test(parts[startIndex + 1])) {
          startIndex += 1;
        }*/

        this._extractStreetParts(startIndex);
        break;
      } // if
    } // for
  } // for

  return this;
};

/**
  #### Address#finalize

  The finalize function takes any remaining parts that have not been extracted
  as other information, and pushes those fields into a generic `regions` field.
**/
proto.finalize = function() {
  // update the regions, discarding any empty strings.
  this.regions = this.parts.join(' ').split(/\,\s?/).filter(function (region) {
      return region.length;
  });

  // clean out numeric ordinal abbreviations
  this.street = this.street.replace(/(\d+)(th|rd|nd|st)\b/g, '$1');
  
  // reset the parts
  this.parts = [];

  return this;
};

/**
  #### Address#split

  Split the address into it's component parts, and remove any empty parts
**/
proto.split = function(separator) {
  // split the string
  var newParts = this.text.split(separator || ' ');

  this.parts = [];
  for (var ii = 0; ii < newParts.length; ii++) {
    if (newParts[ii]) {
      this.parts[this.parts.length] = newParts[ii];
    } // if
  } // for

  return this;
};

/**
  #### Address#toString

  Convert the address to a string representation
**/
proto.toString = function() {
  var output = '';

  if (this.building) {
    output += this.building + '\n';
  } // if

  if (this.street) {
    output += this.number ? this.number + ' ' : '';
    output += this.street + '\n';
  }

  output += this.regions.join(', ') + '\n';

  return output;
};
