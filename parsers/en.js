/* jshint node: true */
'use strict';

var Address = require('../address');
var compiler = require('./compiler');

// initialise the street regexes
// these are the regexes for determining whether or not a string is a street
// it is important to note that they are parsed through the reStreetCleaner
// regex to become more strict
// this list has been sourced from:
// https://www.propertyassist.sa.gov.au/pa/qhelp.phtml?cmd=streettype
//
// __NOTE:__ Some of the street types have been disabled due to collisions
// with common parts of suburb names.  At some point the street parser may be
// improved to deal with these cases, but for now this has been deemed
// suitable.

var streetRegexes = compiler([
  ['AL', 'ALLE?Y|AL'],               // ALLEY / ALLY / AL
  ['AP', 'APP(ROACH)?'],          // APPROACH / APP
  ['AR', 'ARC(ADE)?'],            // ARCADE / ARC
  ['AV', 'AV(E|ENUE)?'],          // AVENUE / AV / AVE
  ['BA', '(BAY|BA|BY)'],     			// BAY / BA / BY
  ['BV', '(BOULEVARD|BLVD|BV|BLV)'],     // BOULEVARD / BLVD / BLV / BV
  ['BROW', 'BROW'],                 // BROW
  ['BYPASS', 'BYPA(SS)?'],            // BYPASS / BYPA
  ['CA', 'CA(PE)?'],          	// CAPE / CA
  ['CAUSEWAY', 'C(AUSE)?WAY'],          // CAUSEWAY / CWAY
  ['CE', '(CENTRE|CENTER|CE|CTR)'],      // CENTRE / CENTER / CE / CTR
  ['CI', 'CI(RCLE)?|CIR'],            // CIRCLE / CI / CIR
  ['CIRCUIT', '(CIRCUIT|CCT)'],        // CIRCUIT / CCT
  ['CIRCUS', 'CIRC(US)?'],            // CIRCUS / CIRC
  ['CL', 'CL(OSE)?'],             // CLOSE / CL
  ['CM', '(COMMON|CM|CMN)'],               // COMMON / CM / CMN
  ['COPSE', 'CO?PSE'],               // COPSE / CPSE
  ['CORNER', '(CORNER|CNR)'],         // CORNER / CNR
  ['CV', '(COVE|CV)'],               // COVE / CV
  ['CO', 'C(OUR)?T|CRT|CO'],      // COURT / CT / CO / CRT
  ['CR', 'CR(ES)?(CENT)?'],       // CRESCENT / CRES / CR
  ['DR', 'DR(IVE)?|DRV'],             // DRIVE / DR
  // 'END',                  // END
  ['ESPLANANDE', 'ESP(LANANDE)?'],        // ESPLANADE / ESP
  // 'FLAT'],                 // FLAT
  ['FREEWAY', 'F(REE)?WAY'],           // FREEWAY / FWAY
  ['FRONTAGE', '(FRONTAGE|FRNT)'],      // FRONTAGE / FRNT
  ['GD', '(GARDENS?|GD|GDNS?|GARS?)'],       // GARDENS / GARDEN / GD / GDNS / GAR / GARS
  ['GA', '(GATE|GA|GT)'],          // GATE / GA / GT
  ['GLADE', '(GLADE|GLD)'],          // GLADE / GLD
  // 'GLEN',                 // GLEN
  ['GREEN', 'GR(EE)?N|GR'],             // GREEN / GRN / GR
  ['GV', 'GROVE|GR?V'],             // GROVE / GRV / GV
  ['HE', 'HE(ATH)?'],        // HEATH / HE
  ['HT', '(H(EIGH)?TS|HT)'],        // HEIGHTS / HTS / HT
  ['HI', '(HI(GHWAY)?|HWY)'],        // HIGHWAY / HWY / HI
  ['HL', '(HILLS?|HL)'],        // HILL / HILLS / HL
  ['IS', '(IS(LAND)?|ISLE)'],            // ISLAND / IS / ISLE
  ['LD', '(LD|LANDING)'],            // LANDING / LD
  ['LN', '(LANE|LN)'],            // LANE / LN
  ['LI', '(LI(NK)?|LN?K)'],         // LINK / LI / LNK / LK
  ['LOOP', 'LOOP'],                 // LOOP
  ['MALL', 'MALL'],                 // MALL
  ['MR', 'M(ANO)?R'],    // MANOR / MR
  ['ME', '(MEWS?|ME|MW)'],   // MEWS / MEW / ME / MW
  ['MT', '(M(OUN)?T|MNT)'],   // MOUNT / MT / MNT
  ['PACKET', '(PACKET|PCKT)'],        // PACKET / PCKT
  ['PR', '(P(ARA)?DE|PRD?|PRDE)'],            // PARADE / PDE, PR /PRD / PRDE
  ['PA', '(P(AR)?K|PA)'],            // PARK / PA / PK
  ['PY', '(P(ARKWA)?Y|PKWY)'],       // PARKWAY / PKWY / PY
  ['PS', '(PASSAGE|P(AS)?S)'],       // PASSAGE / PS / PASS
  ['PH', 'P(AT)?H'],       // PATH / PH
  ['PL', 'PL(ACE)?'],             // PLACE / PL
  ['PZ', '(PLAZA|PZ|PLZ)'],             // PLAZA / PLZ / PZ
  ['PT', '(P(OIN)?T|PNT)'],             // POINT / PT / PNT
  ['PROMENADE', 'PROM(ENADE)?'],         // PROMENADE / PROM
  ['RESERVE', 'RES(ERVE)?'],           // RESERVE / RES
  // 'RI?DGE'],               // RIDGE / RDGE
  ['RI', 'RI(SE)?'],                 // RISE / RI
  ['RD', 'R(OA)?D'],              // ROAD / RD
  ['RO', 'ROW?'],                  // ROW / RO
  ['SQ', 'SQ(UARE)?'],            // SQUARE / SQ
  ['ST', '(ST(REET)?|STR)'],            // STREET / ST / STR
  ['STRIP', 'STRI?P'],               // STRIP / STRP
  ['TARN', 'TARN'],                 // TARN
  ['TC', '(T(ERRA)?CE|TC)'],           // TERRACE / TCE / TC
  ['THOROUGHFARE', '(THOROUGHFARE|TFRE)'],  // THOROUGHFARE / TFRE
  ['TRACK', 'TRACK?'],               // TRACK / TRAC
  ['TR', 'TR(AIL)?'],               // TRAIL / TR
  ['TRUNKWAY', 'T(RUNK)?WAY'],          // TRUNKWAY / TWAY
  ['VW', 'V(IE)?W'],               // VIEW / VW
  ['VI', 'VI(LAS)?'],               // VILAS / VI
  ['VISTA', 'VI?STA'],               // VISTA / VSTA
  ['WK', 'W(AL)?K'],                 // WALK / WK
  ['WY', 'WA?Y'],                 // WAY / WY
  ['WALKWAY', 'W(ALK)?WAY'],           // WALKWAY / WWAY
  ['YARD', 'YARD']                  // YARD
]);

var reSplitStreet = /^(N|NTH|NORTH|E|EST|EAST|S|STH|SOUTH|W|WST|WEST|NW|SW|NE|SE)\,$/i;

module.exports = function (text, opts) {
    return new Address(text, opts)
      // clean the address
      .clean([
          // remove trailing dots from one or two letter abbreviations
          function (input) {
              return input.replace(/(\w{1,2})\./g, '$1');
          },

          // remove trailing dots and commas and replace with space
          function (input) {
              return input.replace(/(\.|,)/g, ' ');
          },
		  
          // convert shop to a unit format
          function (input) {
              return input.replace(/^\s*SHOP\s?(\d*)\,?\s*/i, '$1/');
          },
		  
		  // tighten spaced meanings
		  function (input) {
              input = input.replace(/SOUTH\sEAST/i, 'SE');
              input = input.replace(/SOUTH\sWEST/i, 'SW');
              input = input.replace(/NORTH\sEAST/i, 'NE');
              input = input.replace(/NORTH\sWEST/i, 'NW');
			  return input;
          },
		  
      ])

      // split the address
      .split(/\s/)

      // extract the unit
      .extract('unit', [
          (/^(?:\#|APT|APARTMENT)\s?(\d+)/),
          (/^(\d+)\/(.*)/)
      ])

      // extract the country
      .extract('country', {
          AU: /^AUSTRAL/i,
          US: /(^UNITED\sSTATES|^U\.?S\.?A?$)/i,
          CANADA: /(^CA(NADA)?$)/i
      }, {breakout:true, sideness:'right'})

      // extract the province
      .extract('province', {
          ALBERTA: /^(AL(BER)?(TA)?|A\.?B\.?)$/i,
          ON: /^(O\.?N\.?T\.?$|ON(TARIO)?)$/i,
          BC: /^(BC|B\.C(\.)?|BRITISH\sCOLUMBIA)$/i,
          QC: /^(QC$|QUEBEC|PQ)/i,
          NS: /^(NS|NOVA\sSCOTIA)/i,
          NB: /^(NB|NEW\sBRUNSWICK)/i,
          MB: /^(M(ANITO)?BA?)/i,
          PE: /^(P(RINCE\s)?E(DWARD\s)?I?(SLAND)?)/i,
          SK: /^(S(AS)?K(ATCHEWAN)?)/i,
          NL: /^(N(EW)?F(OUN)?D?L?(AN)?D?)|NL$/i,
          NT: /^(NORTH\sWEST\sTERRITORIES|NWT|NT|N\.W\.T\.)/i,
          YT: /^(YU?K?(ON)?T?)/i,
          NU: /^(YU?K?(ON)?T?)/i
      }, {breakout:true, sideness:'right'})

      // extract the city
      .extract('city', {
          CALGARY: /^CAL(GARY)?$/i,
          AIRDRIE: /^AIRDRIE$/i,
          EDMONTON: /^EDMONTON$/i,
          COCHRANE: /^COCHRANE$/i,
          OKOTOKS: /^OKOTOKS$/i,
          CHESTERMERE: /^CHESTERMERE$/i
      }, {breakout:true, sideness:'right'})

      // extract the direction
      .extract('direction', {
          NW: /^NW/i,
          NE: /^NE/i,
          SW: /^SW/i,
          SE: /^SE/i
      }, {breakout:true, sideness:'right'})

      // extract the street
      .extractStreet(streetRegexes, reSplitStreet)

      // finalize the address
      .finalize();
};