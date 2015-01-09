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
  ['ALLEY', 'ALLE?Y|AL'],               // ALLEY / ALLY / AL
  ['APPROACH', 'APP(ROACH)?'],          // APPROACH / APP
  ['ARCADE', 'ARC(ADE)?'],            // ARCADE / ARC
  ['AVENUE', 'AV(E|ENUE)?'],          // AVENUE / AV / AVE
  ['BAY', '(BAY|BA|BY)'],     			// BAY / BA / BY
  ['BOULEVARD', '(BOULEVARD|BLVD|BV|BLV)'],     // BOULEVARD / BLVD / BLV / BV
  ['BROW', 'BROW'],                 // BROW
  ['BYPASS', 'BYPA(SS)?'],            // BYPASS / BYPA
  ['CAPE', 'CA(PE)?'],          	// CAPE / CA
  ['CAUSEWAY', 'C(AUSE)?WAY'],          // CAUSEWAY / CWAY
  ['CENTRE', '(CENTRE|CENTER|CE|CTR)'],      // CENTRE / CENTER / CE / CTR
  ['CIRCLE', 'CI(RCLE)?|CIR'],            // CIRCLE / CI / CIR
  ['CIRCUIT', '(CIRCUIT|CCT)'],        // CIRCUIT / CCT
  ['CIRCUS', 'CIRC(US)?'],            // CIRCUS / CIRC
  ['CLOSE', 'CL(OSE)?'],             // CLOSE / CL
  ['COMMON', '(COMMON|CM|CMN)'],               // COMMON / CM / CMN
  ['COPSE', 'CO?PSE'],               // COPSE / CPSE
  ['CORNER', '(CORNER|CNR)'],         // CORNER / CNR
  ['COVE', '(COVE|CV)'],               // COVE / CV
  ['COURT', 'C(OUR)?T|CRT|CO'],      // COURT / CT / CO / CRT
  ['CRESCENT', 'CR(ES)?(CENT)?'],       // CRESCENT / CRES / CR
  ['DRIVE', 'DR(IVE)?|DRV'],             // DRIVE / DR
  // 'END',                  // END
  ['ESPLANANDE', 'ESP(LANANDE)?'],        // ESPLANADE / ESP
  // 'FLAT'],                 // FLAT
  ['FREEWAY', 'F(REE)?WAY'],           // FREEWAY / FWAY
  ['FRONTAGE', '(FRONTAGE|FRNT)'],      // FRONTAGE / FRNT
  ['GARDENS', '(GARDENS?|GD|GDNS?|GARS?)'],       // GARDENS / GARDEN / GD / GDNS / GAR / GARS
  ['GATE', '(GATE|GA|GT)'],          // GATE / GA / GT
  ['GLADE', '(GLADE|GLD)'],          // GLADE / GLD
  // 'GLEN',                 // GLEN
  ['GREEN', 'GR(EE)?N|GR'],             // GREEN / GRN / GR
  ['GROVE', 'GROVE|GR?V'],             // GROVE / GRV / GV
  ['HEATH', 'HE(ATH)?'],        // HEATH / HE
  ['HEIGHTS', '(H(EIGH)?TS|HT)'],        // HEIGHTS / HTS / HT
  ['HIGHWAY', '(HI(GHWAY)?|HWY)'],        // HIGHWAY / HWY / HI
  ['HILL', '(HILLS?|HL)'],        // HILL / HILLS / HL
  ['ISLAND', '(IS(LAND)?|ISLE)'],            // ISLAND / IS / ISLE
  ['LANDING', '(LD|LANDING)'],            // LANDING / LD
  ['LANE', '(LANE|LN)'],            // LANE / LN
  ['LINK', '(LI(NK)?|LN?K)'],         // LINK / LI / LNK / LK
  ['LOOP', 'LOOP'],                 // LOOP
  ['MALL', 'MALL'],                 // MALL
  ['MANOR', 'M(ANO)?R'],    // MANOR / MR
  ['MEWS', '(MEWS?|ME|MW)'],   // MEWS / MEW / ME / MW
  ['MOUNT', '(M(OUN)?T|MNT)'],   // MOUNT / MT / MNT
  ['PACKET', '(PACKET|PCKT)'],        // PACKET / PCKT
  ['PARADE', '(P(ARA)?DE|PRD?|PRDE)'],            // PARADE / PDE, PR /PRD / PRDE
  ['PARK', '(P(AR)?K|PA)'],            // PARK / PA / PK
  ['PARKWAY', '(P(ARKWA)?Y|PKWY)'],       // PARKWAY / PKWY / PY
  ['PASSAGE', '(PASSAGE|P(AS)?S)'],       // PASSAGE / PS / PASS
  ['PATH', 'P(AT)?H'],       // PATH / PH
  ['PLACE', 'PL(ACE)?'],             // PLACE / PL
  ['PLAZA', '(PLAZA|PZ|PLZ)'],             // PLAZA / PLZ / PZ
  ['POINT', '(P(OIN)?T|PNT)'],             // POINT / PT / PNT
  ['PROMENADE', 'PROM(ENADE)?'],         // PROMENADE / PROM
  ['RESERVE', 'RES(ERVE)?'],           // RESERVE / RES
  // 'RI?DGE'],               // RIDGE / RDGE
  ['RISE', 'RI(SE)?'],                 // RISE / RI
  ['ROAD', 'R(OA)?D'],              // ROAD / RD
  ['ROW', 'ROW?'],                  // ROW / RO
  ['SQUARE', 'SQ(UARE)?'],            // SQUARE / SQ
  ['STREET', '(ST(REET)?|STR)'],            // STREET / ST / STR
  ['STRIP', 'STRI?P'],               // STRIP / STRP
  ['TARN', 'TARN'],                 // TARN
  ['TERRACE', '(T(ERRA)?CE|TC)'],           // TERRACE / TCE / TC
  ['THOROUGHFARE', '(THOROUGHFARE|TFRE)'],  // THOROUGHFARE / TFRE
  ['TRACK', 'TRACK?'],               // TRACK / TRAC
  ['TRAIL', 'TR(AIL)?'],               // TRAIL / TR
  ['TRUNKWAY', 'T(RUNK)?WAY'],          // TRUNKWAY / TWAY
  ['VIEW', 'V(IE)?W'],               // VIEW / VW
  ['VILAS', 'VI(LAS)?'],               // VILAS / VI
  ['VISTA', 'VI?STA'],               // VISTA / VSTA
  ['WALK', 'W(AL)?K'],                 // WALK / WK
  ['WAY', 'WA?Y'],                 // WAY / WY
  ['WALKWAY', 'W(ALK)?WAY'],           // WALKWAY / WWAY
  ['YARD', 'YARD']                  // YARD
]);

var reSplitStreet = /^(N|NTH|NORTH|E|EST|EAST|S|STH|SOUTH|W|WST|WEST|NW|SW|NE|SE|N\.W\.|N\.E\.|S\.W\.|S\.E\.)\,$/i;

module.exports = function (text, opts) {
    return new Address(text, opts)
      // clean the address
      .clean([
          // remove trailing dots from two letter abbreviations
          function (input) {
              return input.replace(/(\w{2})\./g, '$1');
          },

          // convert shop to a unit format
          function (input) {
              return input.replace(/^\s*SHOP\s?(\d*)\,?\s*/i, '$1/');
          }
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
          AU: /^AUSTRAL/,
          US: /(^UNITED\sSTATES|^U\.?S\.?A?$)/,
          CA: /(^CA(NADA)?$)/
      })

      // extract the street
      .extractStreet(streetRegexes, reSplitStreet)

      // finalize the address
      .finalize();
};