/*jslint browser: true */ /*globals _, angular, cookies, LoggedInput, stringifyResponse */
var app = angular.module('experimentApp', [
  'ui.router',
  'pascalprecht.translate', // for $translateProvider and | translate filters
  'ngResource',
  'typing-evaluation-models',
]);

app.filter('trustResourceUrl', function($sce) {
  return function(string) {
    return $sce.trustAsResourceUrl(string);
  };
});

app.config(function($provide) {
  /** monkeypatch ui-router's injectable $state object */
  $provide.decorator('$state', function($delegate) {
    // the argument to this function must be "$delegate"
    $delegate.goRel = function goRel(to, params, options) {
      var merged_params = angular.extend({}, $delegate.params, params);
      return $delegate.go(to, merged_params, options);
    };
    return $delegate;
  });
});

app.config(function($translateProvider) {
  // http://angular-translate.github.io/docs/#/guide
  // $translateProvider.translations('en', {
  //   'Gender': 'Gender',
  //   'Date of birth': 'Date of birth',
  // });

  $translateProvider.translations('es', {
    'Gender': 'Género',
    'Date of birth': 'Fecha de nacimiento',
  });

  $translateProvider.preferredLanguage('en');
});

app.config(function($urlRouterProvider, $stateProvider, $locationProvider) {
  $urlRouterProvider.otherwise(function($injector, $location) {
    // $location is kind of broken (its getter functions return undefined) if
    // the current url is not under the current base[href]

    // the returned value should be a url expressed relative to the page's base[href]
    return 'instructions' + window.location.search;
  });

  var PARAMS = '?' + ['assignmentId', 'hitId', 'workerId', 'turkSubmitTo', 'demographics'].join('&');

  // the url value in each state is interpreted relative to the page's
  // base[href] value, despite being an absolute path
  $stateProvider
  .state('instructions', {
    url: '/instructions' + PARAMS,
    templateUrl: '/ng/experiment/instructions.html',
  })
  .state('demographics', {
    url: '/demographics' + PARAMS,
    templateUrl: '/ng/experiment/demographics.html',
    controller: 'demographics',
  })
  .state('sentence', {
    url: '/sentence/{id}' + PARAMS,
    templateUrl: '/ng/experiment/sentence.html',
    controller: 'sentence',
  })
  .state('conclusion', {
    url: '/conclusion' + PARAMS,
    templateUrl: '/ng/experiment/conclusion.html',
    controller: 'conclusion',
  });

  $locationProvider.html5Mode(true);
});

/** a[ui-sref-rel="other_state"]

Simplified version of ui-sref because ui-sref doesn't actually inherit the
current state params. Goes well with the $state.goRel function declared above.
*/
app.directive('uiSrefRel', function($state) {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      el.attr('href', $state.href(attrs.uiSrefRel, $state.params));
    }
  };
});

app.controller('demographics', function($scope, $state, Participant) {
  $scope.demographics = {};

  $scope.submit = function(ev) {
    var participant = new Participant({
      demographics: $scope.demographics,
      parameters: $state.params,
    });

    participant.$save().then(function(res) {
      cookies.set('participant_id', participant.id);
      $state.goRel('sentence', {id: 'next'});
    }, function(res) {
      console.error(res);
    });
  };

  if ($state.params.demographics) {
    $scope.enabled = true;
  }
  else {
    $scope.submit();
  }
});

app.controller('sentence', function($scope, $state, Sentence, Participant, Response) {
  $scope.participant = Participant.get({
    id: cookies.get('participant_id'),
  }, function() {
    $scope.sentence = Sentence.get({
      id: $state.params.id,
      participant_id: $scope.participant.id,
    });

    $scope.sentence.$promise.then(function(res) {
      $state.goRel('.', {id: $scope.sentence.id}, {notify: false});
    }, function(res) {
      if (res.status == 404) {
        return $state.goRel('conclusion');
      }
      console.error('$scope.sentence.$promise error', res);
    });
  });

  $scope.logged_input = new LoggedInput();

  document.addEventListener('keydown', function(ev) {
    // pass over (ignore) all meta (super/command) keys; only intercept non-meta keys
    $scope.$apply(function() {
      if (ev.which == 13) { // enter/return key
        $scope.submit(ev);
      }
      if (!ev.metaKey) {
        ev.preventDefault();
        $scope.logged_input.applyKey(ev.which, ev.shiftKey, ev.timeStamp);
      }
    });
  });

  $scope.submit = function(ev) {
    var response = new Response({
      sentence_id: $scope.sentence.id,
      participant_id: $scope.participant.id,
      keystrokes: $scope.logged_input.events,
    });

    response.$save().then(function(res) {
      $state.goRel('sentence', {id: 'next'});
    }, function(res) {
      console.error(res);
      // return 'Error saving sentence. ' + stringifyResponse(res);
    });
  };
});

app.controller('conclusion', function($scope, $stateParams) {
  $scope.turkSubmitTo = $stateParams.turkSubmitTo;
  $scope.assignmentId = $stateParams.assignmentId;
});
