/** ngStorage 0.3.0 | Copyright (c) 2013 Gias Kay Lee | MIT License */
const angular = require('angular')

function _storageFactory(storageType) {
  return [
    '$rootScope',
    '$window',

    function($rootScope, $window) {
      // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
      const webStorage = $window[storageType] || (console.warn('This browser does not support Web Storage!'), {})

      const $storage = {
        $default: function(items) {
          for (const k in items) {
            if (!angular.isDefined($storage[k])) {
              $storage[k] = items[k]
            }
          }

          return $storage
        },
        $reset: function(items) {
          for (const k in $storage) {
            if (k[0] !== '$') {
              delete $storage[k]
            }
          }

          return $storage.$default(items)
        },
      }

      let _last$storage

      let _debounce

      for (let i = 0; i < webStorage.length; i++) {
        // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
        const k = webStorage.key(i)
        if (k.slice(0, 10) === 'ngStorage-') {
          $storage[k.slice(10)] = angular.fromJson(webStorage.getItem(k))
        }
      }

      _last$storage = angular.copy($storage)

      $rootScope.$watch(() => {
        if (!_debounce) {
          _debounce = setTimeout(() => {
            _debounce = null

            if (!angular.equals($storage, _last$storage)) {
              angular.forEach($storage, (v, k) => {
                if (angular.isDefined(v) && k[0] !== '$') {
                  webStorage.setItem('ngStorage-' + k, angular.toJson(v))
                }

                delete _last$storage[k]
              })

              for (const k in _last$storage) {
                webStorage.removeItem('ngStorage-' + k)
              }

              _last$storage = angular.copy($storage)
            }
          }, 100)
        }
      })

      // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
      if (storageType === 'localStorage' && $window.addEventListener) {
        $window.addEventListener('storage', (event) => {
          if (event.key.slice(0, 10) === 'ngStorage-') {
            if (event.newValue) {
              $storage[event.key.slice(10)] = angular.fromJson(event.newValue)
            }
            else {
              delete $storage[event.key.slice(10)]
            }

            _last$storage = angular.copy($storage)

            $rootScope.$apply()
          }
        })
      }

      return $storage
    },
  ]
}

angular.module('ngStorage', []).
factory('$localStorage', _storageFactory('localStorage')).
factory('$sessionStorage', _storageFactory('sessionStorage'))
