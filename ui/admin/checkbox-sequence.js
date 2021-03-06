/** Copyright 2015, Christopher Brown <io@henrian.com>, MIT Licensed

Shift-click to select contiguous sequences of checkboxes.

Angular.js module:

    app.directive('checkboxSequence', function() {
      return {
        restrict: 'A',
        link: function(scope, el, attrs) {
          scope.checkbox_sequence = new CheckboxSequence(el[0]);
        }
      };
    });

Angular.js html:

    <table checkbox-sequence>
      <tr ng-repeat="user in users">
        <td><input type="checkbox" ng-model="user.selected"></td>
        <td>{{user.id}}</td>
        <td>{{user.name}}</td>
      </tr>
    </table>

*/
export function CheckboxSequence(container) {
  const self = this
  // previous_checkbox is the last clicked checkbox element
  this.previous_checkbox = null
  // previous_checked is the resulting checked status of the last clicked
  // checkbox element (unchecked->checked: true, checked->unchecked: false)
  this.previous_checked = null
  // listen for clicks on the containing element
  container.addEventListener('click', (ev) => {
    // but only do anything with clicks on checkboxes
    if (ev.target.getAttribute('type') == 'checkbox') {
      const current_checkbox = ev.target
      const current_checked = current_checkbox.checked
      // only connect between two checkboxes if they were both turned to
      // the same checked status, and shift is being held down
      if (ev.shiftKey && self.previous_checkbox && self.previous_checked == current_checked) {
        const checkboxes = container.querySelectorAll('[type="checkbox"]')
        let start_checkbox = null
        let end_checkbox = null
        const click_event = new Event('click')
        // select all entries between the two, exclusive (the endpoints are
        // already in the desired state)
        for (let i = 0; i < checkboxes.length; i++) {
          const checkbox = checkboxes[i]
          // we're not sure if current_checkbox comes before or after
          // last_checkbox in the DOM tree, so we have to watch out for both
          // until we see one of them
          if (start_checkbox === null) {
            if (checkbox == self.previous_checkbox) {
              // previous_checkbox precedes current_checkbox in the DOM
              start_checkbox = self.previous_checkbox
              end_checkbox = current_checkbox
            }
            else if (checkbox == current_checkbox) {
              // current_checkbox precedes previous_checkbox in the DOM
              start_checkbox = current_checkbox
              end_checkbox = self.previous_checkbox
            }
          }
          else {
            // if we have set start_checkbox, we are currently inside the
            // sequence to be selected, and only need to watch for end_checkbox.
            if (checkbox == end_checkbox) {
              break
            }
            // otherwise, set the checkbox's checked value to current_checked
            checkbox.checked = current_checked
            // and inform any listeners that it's been "clicked"
            checkbox.dispatchEvent(click_event)
          }
        }
      }
      self.previous_checkbox = current_checkbox
      self.previous_checked = current_checked
    }
  })
}
