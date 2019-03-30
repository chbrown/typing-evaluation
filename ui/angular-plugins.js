/** Copyright 2012-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/angular-plugins.js

*/
const angular = require('angular')

angular.module('misc-js/angular-plugins', [])
.directive('enhance', () => {
  /** Only use this if you've loaded misc-js/textarea.js! */
  return {
    restrict: 'A',
    require: '?ngModel',
    scope: {},
    link: function(scope, el, attrs, ngModel) {
      // enhance textarea (check if it's a textarea)
      const textarea = el[0]
      if (textarea.tagName.toLowerCase() == 'textarea') {
        if (window.Textarea) {
          window.Textarea.enhance(textarea)
        }
        else {
          console.error('Cannot enhance <textarea> without first loading textarea.js', textarea)
        }
      }

      if (ngModel) {
        // console.log(textarea, 'ngModel', ngModel);
        // I think the built-in ng-model will handle actually setting the value?
        ngModel.$render = function() {
          // handle undefined input value by representing it as the empty string
          textarea.value = (ngModel.$viewValue === undefined || ngModel.$viewValue === null) ? '' : ngModel.$viewValue
          // jump out of the $digest in case a different ng-model controller is listening
          setTimeout(() => {
            // but we need to trigger an 'input' event so that the enhanced Textarea triggers a resize
            textarea.dispatchEvent(new Event('input'))
          }, 0)
        }
        el.on('blur keyup change', () => {
          scope.$apply(() => {
            ngModel.$setViewValue(textarea.value)
          })
        })
      }
    },
  }
})
// services
.service('$flash', ($rootScope) => {
  // basically a $rootScope wrapper
  return function(value, timeout = 3000) {
    // value can be a string or a promise
    // default to a 3 second timeout, but allow permanent flashes
    $rootScope.$broadcast('flash', value, timeout)
  }
})
.directive('flash', ($timeout, $q) => {
  /**
  Inject $flash and use like:
      $flash('OMG it burns!')
  or
      $flash(asyncResultPromise)
  */
  return {
    restrict: 'E',
    template:
      '<div class="flash" ng-show="messages.length > 0">' +
        '<span ng-repeat="message in messages track by $index" ng-bind="message"></span>' +
      '</div>',
    replace: true,
    scope: {messages: '&'},
    link: function(scope) {
      scope.messages = []

      scope.add = function(message) {
        scope.messages.push(message)
      }
      scope.remove = function(message) {
        const index = scope.messages.indexOf(message)
        scope.messages.splice(index, 1)
      }

      scope.$on('flash', (ev, value, timeout) => {
        scope.add('...')

        // for some reason, .finally() doesn't get the promise's value,
        // so we have to use .then(a, a)
        const done = function(message) {
          // so we recreate
          scope.remove('...')
          scope.add(message)

          // if timeout is null, for example, leave the message permanently
          if (timeout) {
            $timeout(() => {
              scope.remove(message)
            }, timeout)
          }
        }
        // wrap value with .when() to support both strings and promises of strings
        $q.when(value).then(done, done)
      })
    },
  }
})
