/*jslint browser: true */ /*globals angular, stringifyResponse, cookies */
var app = angular.module('adminApp', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'pascalprecht.translate', // for $translateProvider and | translate filters
  'typing-evaluation-models',
  'misc-js/angular-plugins',
]);

function stringifyResponse(res) {
  if (res.data.message) {
    return res.data.message;
  }
  if (typeof res.data === 'string')  {
    return res.data;
  }
  return JSON.stringify(res.data);
}

app.directive('checkboxSequence', function() {
  /** Use like:

    <ul checkbox-sequence>
      <li ng-repeat="user in users">
        <label><input type="checkbox" ng-model="user.selected"> {{user.name}}</label>
      </li>
    </ul>

  */
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      var previous_checkbox = null;
      // previous_action == true means the last selection was to change
      // a checkbox from unchecked to checked
      var previous_action = null;

      // addEventListener('DOMSubtreeModified', function()
      // requires jQuery (not just jQ-lite) for the selector stuff
      var sel = 'input[type="checkbox"]';
      el.on('click', function(ev) {
        console.log('click', ev);
        // var action = ev.target.checked; // true = just checked, false = just unchecked
        if (false && ev.shiftKey) {
          if (action === previous_action && previous_checkbox) {
            var checkboxes = el.find(sel);
            var inside = false;
            // select all entries between the two, inclusive
            for (var i = 0, l = checkboxes.length; i < l; i++) {
              var checkbox = checkboxes[i];
              var boundary = checkbox == previous_checkbox || checkbox == ev.target;
              if (boundary) {
                if (inside === false) {
                  // the first boundary we hit puts us inside
                  inside = true;
                }
                else {
                  // the secondary boundary puts us outside, so we break out
                  break;
                }
              }
              else if (inside) {
                checkbox.checked = action;
                // checkbox.dispatchEvent(new Event('input', true, true));
                // angular.element(checkbox).trigger('click');
                // angular.element(checkbox).trigger('change');
                // angular.element(checkbox).prop('checked', action);
                angular.element(checkbox).triggerHandler('click');
              }
            }
          }
        }
        previous_checkbox = ev.target;
        // previous_action = action;
      });

    },
  };
});

app.config(function($stateProvider, $locationProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise(function($injector, $location) {
    // the returned value should be a url expressed relative to the page's base[href]
    return 'sentences/';
  });

  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: '/ui/admin/login.html',
    controller: 'login',
  })
  // sentences
  .state('sentences', {
    url: '/sentences',
    templateUrl: '/ui/admin/sentences/layout.html',
    abstract: true,
  })
  .state('sentences.list', {
    url: '/',
    templateUrl: '/ui/admin/sentences/list.html',
    controller: 'sentences.list',
  })
  .state('sentences.import', {
    url: '/import',
    templateUrl: '/ui/admin/sentences/import.html',
    controller: 'sentences.import'
  })
  // matches /import, so edit must come after import
  .state('sentences.edit', {
    url: '/{id}',
    templateUrl: '/ui/admin/sentences/edit.html',
    controller: 'sentences.edit'
  })
  // administrators
  .state('administrators', {
    url: '/administrators',
    templateUrl: '/ui/admin/administrators/layout.html',
    abstract: true,
  })
  .state('administrators.list', {
    url: '/',
    templateUrl: '/ui/admin/administrators/list.html',
    controller: 'administrators.list',
  })
  .state('administrators.edit', {
    url: '/{id}',
    templateUrl: '/ui/admin/administrators/edit.html',
    controller: 'administrators.edit'
  })
  // participants
  .state('participants', {
    url: '/participants',
    templateUrl: '/ui/admin/participants/layout.html',
    abstract: true,
  })
  .state('participants.list', {
    url: '/',
    templateUrl: '/ui/admin/participants/list.html',
    controller: 'participants.list',
  })
  .state('participants.edit', {
    url: '/{id}',
    templateUrl: '/ui/admin/participants/edit.html',
    controller: 'participants.edit'
  })
  // responses
  .state('responses', {
    url: '/responses',
    templateUrl: '/ui/admin/responses/layout.html',
    abstract: true,
  })
  .state('responses.list', {
    url: '/',
    templateUrl: '/ui/admin/responses/list.html',
    controller: 'responses.list',
  });

  $locationProvider.html5Mode(true);
});

app.config(function($httpProvider) {
  // trying to inject $state below creates a circular dependency conflict
  $httpProvider.interceptors.push(function($q, $rootScope) {
    return {
      responseError: function(res) {
        if (res.status == 401) {
          $rootScope.$broadcast('unauthorized', res);
        }
        return $q.reject(res);
      },
    };
  });
});

app.run(function($rootScope, $state) {
  $rootScope.$on('unauthorized', function(event, res) {
    $state.go('login');
  });
});

app.controller('login', function($scope, $flash, $window, AccessToken) {
  $scope.submit = function(ev) {
    var access_token = AccessToken.authenticateUser({
      email: $scope.email,
      password: $scope.password
    });

    var promise = access_token.$promise.then(function(res) {
      cookies.set('user_access_token', access_token.token);
      setTimeout(function() {
        $window.history.back();
      }, 500);
      return 'Logged in; returning to previous page.';
    }, function(res) {
      var message = res.data.message || res.data.toString();
      return 'Failed to login. ' + message;
    });
    $flash(promise);
  };
});

app.controller('sentences.list', function($scope, $flash, Sentence) {
  $scope.sentences = Sentence.query({active: true});

  $scope.delete = function(sentence) {
    var promise = sentence.$delete().then(function(res) {
      $scope.sentences.splice($scope.sentences.indexOf(sentence), 1);
      return 'Deleted sentence.';
    }, function(res) {
      return 'Error deleting sentence. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});

app.controller('sentences.edit', function($scope, $flash, $state, Sentence) {
  $scope.sentence = Sentence.get($state.params);

  $scope.submit = function(ev) {
    var promise = $scope.sentence.$save().then(function(res) {
      $state.go('.', {id: $scope.sentence.id}, {notify: false});
      return 'Saved sentence.';
    }, function(res) {
      return 'Error saving sentence. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});

app.controller('sentences.import', function($scope, $q, $flash, $state, Sentence) {
  $scope.active = true;
  $scope.language = 'en';

  $scope.prepare = function(ev) {
    var texts = $scope.input.trim().split(/\n/);

    // find the maximum view_order in the sentences table
    Sentence.query({order: 'view_order', direction: 'DESC', limit: 1}, function(sentences) {
      var max_view_order = (sentences.length > 0) ? sentences[0].view_order : 0;
      var next_view_order = max_view_order + 1;
      // now construct all the sentences that will be inserted (if submitted)
      $scope.sentences = texts.map(function(text, i) {
        return new Sentence({
          text: text,
          language: $scope.language,
          active: $scope.active,
          view_order: next_view_order + i,
        });
      });
    });
  };

  $scope.submit = function(ev) {
    var promises = $scope.sentences.map(function(sentence) {
      return sentence.$save();
    });
    var promise = $q.all(promises).then(function(res) {
      return 'Inserted ' + res.length + ' sentences.';
    }, function(res) {
      return 'Error saving sentence. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});


app.controller('administrators.list', function($scope, $flash, Administrator) {
  $scope.administrators = Administrator.query();

  $scope.delete = function(administrator) {
    var promise = administrator.$delete().then(function(res) {
      $scope.administrators.splice($scope.administrators.indexOf(administrator), 1);
      return 'Deleted administrator.';
    }, function(res) {
      return 'Error deleting administrator. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});


app.controller('administrators.edit', function($scope, $flash, $state, Administrator) {
  $scope.administrator = Administrator.get({id: $state.params.id});

  $scope.submit = function(ev) {
    var promise = $scope.administrator.$save().then(function(res) {
      $state.go('.', {id: $scope.administrator.id}, {notify: false});
      return 'Saved administrator.';
    }, function(res) {
      return 'Error saving administrator. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});


app.controller('participants.list', function($scope, $flash, Participant) {
  $scope.participants = Participant.query();

  $scope.delete = function(participant) {
    var promise = participant.$delete().then(function(res) {
      $scope.participants.splice($scope.participants.indexOf(participant), 1);
      return 'Deleted participant.';
    }, function(res) {
      return 'Error deleting participant. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});


app.controller('participants.edit', function($scope, $flash, $state, Participant, Response) {
  $scope.participant = Participant.get({id: $state.params.id});
  $scope.responses = Response.query({participant_id: $state.params.id});
});


app.controller('responses.list', function($scope, $flash, Response) {
  $scope.responses = Response.query({limit: 100});
  $scope.accept = 'application/json;+boundary=LF'; // default

  $scope.delete = function(response) {
    var promise = response.$delete().then(function(res) {
      $scope.responses.splice($scope.responses.indexOf(response), 1);
      return 'Deleted response.';
    }, function(res) {
      return 'Error deleting response. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});
