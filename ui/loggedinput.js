/*jslint browser: true */
/** Copyright 2014, Christopher Brown <io@henrian.com>, MIT Licensed.

Example:

    var logged_input = new LoggedInput();
    document.addEventListener('keydown', function(ev) {
      if (!ev.metaKey) {
        ev.preventDefault();
        logged_input.applyKey(ev.which, ev.shiftKey, ev.timeStamp);
      }
    });

*/
(function(exports) {
  var keys = {
    32:  {"string": " ", "shift": " "},
    48:  {"string": "0", "shift": ")"},
    49:  {"string": "1", "shift": "!"},
    50:  {"string": "2", "shift": "@"},
    51:  {"string": "3", "shift": "#"},
    52:  {"string": "4", "shift": "$"},
    53:  {"string": "5", "shift": "%"},
    54:  {"string": "6", "shift": "^"},
    55:  {"string": "7", "shift": "&"},
    56:  {"string": "8", "shift": "*"},
    57:  {"string": "9", "shift": "("},
    65:  {"string": "a", "shift": "A"},
    66:  {"string": "b", "shift": "B"},
    67:  {"string": "c", "shift": "C"},
    68:  {"string": "d", "shift": "D"},
    69:  {"string": "e", "shift": "E"},
    70:  {"string": "f", "shift": "F"},
    71:  {"string": "g", "shift": "G"},
    72:  {"string": "h", "shift": "H"},
    73:  {"string": "i", "shift": "I"},
    74:  {"string": "j", "shift": "J"},
    75:  {"string": "k", "shift": "K"},
    76:  {"string": "l", "shift": "L"},
    77:  {"string": "m", "shift": "M"},
    78:  {"string": "n", "shift": "N"},
    79:  {"string": "o", "shift": "O"},
    80:  {"string": "p", "shift": "P"},
    81:  {"string": "q", "shift": "Q"},
    82:  {"string": "r", "shift": "R"},
    83:  {"string": "s", "shift": "S"},
    84:  {"string": "t", "shift": "T"},
    85:  {"string": "u", "shift": "U"},
    86:  {"string": "v", "shift": "V"},
    87:  {"string": "w", "shift": "W"},
    88:  {"string": "x", "shift": "X"},
    89:  {"string": "y", "shift": "Y"},
    90:  {"string": "z", "shift": "Z"},
    186: {"string": ";", "shift": ":"}, // WebKit
    59:  {"string": ";", "shift": ":"}, // Mozilla
    187: {"string": "=", "shift": "+"}, // WebKit
    61:  {"string": "=", "shift": "+"}, // Mozilla
    188: {"string": ",", "shift": "<"},
    189: {"string": "-", "shift": "_"}, // WebKit
    173: {"string": "-", "shift": "_"}, // Mozilla
    190: {"string": ".", "shift": ">"},
    191: {"string": "/", "shift": "?"},
    192: {"string": "`", "shift": "~"},
    219: {"string": "[", "shift": "{"},
    220: {"string": "\\","shift": "|"},
    221: {"string": "]", "shift": "}"},
    222: {"string": "'", "shift": "\""}
  };

  function keyboardEventToString(which, shift) {
    var key = keys[which];
    if (key !== undefined) {
      return shift ? key.shift : key.string;
    }
    else {
      return '';
    }
  }

  var LoggedInput = exports.LoggedInput = function() {
    this.reset();
  };
  LoggedInput.prototype.reset = function() {
    this.characters = [];
    this.events = [];
  };
  LoggedInput.prototype.applyKey = function(which, shift, timestamp) {
    if (which == 8) {
      // backspace/delete key is a special case: it's the only allowed control character
      this.characters.pop();
      this.events.push({timestamp: timestamp, key: 'backspace'});
    }
    else {
      var string = keyboardEventToString(which, shift);
      if (string.length > 0) {
        this.events.push({timestamp: timestamp, key: string});
        this.characters.push(string);
      }
      // else {
      //   console.log('Ignoring key that evaluates to empty string', event);
      // }
    }
  };
})(window);
