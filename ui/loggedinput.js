/*jslint browser: true */
/** Copyright 2014-2015, Christopher Brown <io@henrian.com>, MIT Licensed.

Example:

    var logged_input = new LoggedInput();
    document.addEventListener('keydown', function(ev) {
      // intercept backspace so that the browser doesn't go to the previous page
      if (ev.which == 8) {
        ev.preventDefault();
        logged_input.backspace(ev.timeStamp);
      }
    });
    document.addEventListener('keypress', function(ev) {
      ev.preventDefault();
      var string = String.fromCharCode(ev.charCode);
      logged_input.addString(ev.timeStamp, string);
    });

*/
(function(exports) {
  var LoggedInput = exports.LoggedInput = function() {
    this.characters = [];
    this.events = [];
  };
  LoggedInput.prototype.backspace = function(timestamp) {
    // backspace/delete key is a special case: it's the only allowed control character
    this.characters.pop();
    this.events.push({timestamp: timestamp, key: 'backspace'});
  };
  LoggedInput.prototype.addString = function(timestamp, string) {
    this.characters.push(string);
    this.events.push({timestamp: timestamp, key: string});
  };
})(window);
