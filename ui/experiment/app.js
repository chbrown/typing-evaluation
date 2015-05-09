/*jslint browser: true */ /*globals angular, cookies */
var app = angular.module('experimentApp', [
  'ngResource',
  'ui.router',
  'pascalprecht.translate', // for $translateProvider and | translate filters
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
  $urlRouterProvider.otherwise(function() {
    // $location is kind of broken (its getter functions return undefined) if
    // the current url is not under the current base[href]

    // the returned value should be a url expressed relative to the page's base[href]
    return 'consent' + window.location.search;
  });

  var PARAMS = '?' + ['assignmentId', 'hitId', 'workerId', 'turkSubmitTo', 'demographics', 'consent', 'batch'].join('&');

  // the url value in each state is interpreted relative to the page's
  // base[href] value, despite being an absolute path
  $stateProvider
  .state('consent', {
    url: '/consent' + PARAMS,
    templateUrl: '/ui/experiment/consent.html',
    controller: 'consent',
  })
  .state('instructions', {
    url: '/instructions' + PARAMS,
    templateUrl: '/ui/experiment/instructions.html',
  })
  .state('demographics', {
    url: '/demographics' + PARAMS,
    templateUrl: '/ui/experiment/demographics.html',
    controller: 'demographics',
  })
  .state('sentence', {
    url: '/sentence/{id}' + PARAMS,
    templateUrl: '/ui/experiment/sentence.html',
    controller: 'sentence',
  })
  .state('conclusion', {
    url: '/conclusion' + PARAMS,
    templateUrl: '/ui/experiment/conclusion.html',
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

app.controller('consent', function($scope, $state, Participant) {
  $scope.mturk_preview = $state.params.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE';

  $scope.submit = function() {
    var participant = new Participant({
      parameters: $state.params,
      demographics: {},
    });

    participant.$save().then(function() {
      cookies.set('participant_id', participant.id);
      $state.goRel('instructions');
    }, function(res) {
      console.error(res);
    });
  };

  if ($state.params.consent == 'skip') {
    $scope.submit();
  }
  else {
    $scope.enabled = true;
  }
});

app.controller('demographics', function($scope, $state, Participant) {
  $scope.participant = new Participant({id: cookies.get('participant_id')});
  $scope.demographics = {};

  $scope.submit = function() {
    $scope.participant.demographics = $scope.demographics;
    $scope.participant.$save().then(function() {
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
  // we don't need to load the whole participant
  $scope.participant = new Participant({id: cookies.get('participant_id')});
  $scope.sentence = Sentence.get({
    id: $state.params.id,
    participant_id: $scope.participant.id,
  }, sentenceLoaded, sentenceFailed);

  function sentenceLoaded() {
    // reset input
    $scope.characters = [];
    $scope.events = [];
  }

  function sentenceFailed(res) {
    if (res.status == 404) {
      return $state.goRel('conclusion');
    }
    console.error('Failed to fetch sentence', res);
  }

  $scope.$watch('sentence.id', function() {
    if ($scope.sentence.$resolved) {
      $state.goRel('sentence', {id: $scope.sentence.id}, {notify: false});
    }
  });

  document.addEventListener('keydown', function(ev) {
    // handle special characters that don't equate to a keypress event
    if (ev.which == 8) { // backspace
      // backspace is a special case: it's the only logged control character
      ev.preventDefault();
      $scope.$apply(function() {
        $scope.characters.pop();
        $scope.events.push({timestamp: ev.timeStamp, key: 'backspace'});
      });
    }
    else if (ev.which == 13) { // enter
      ev.preventDefault();
      $scope.$apply(function() {
        $scope.submit(ev);
      });
    }
    // but most key events should drop through to the keypress handler below
  });
  document.addEventListener('keypress', function(ev) {
    // keypress is only called for non-meta keys (not for shift / ctrl / super / command)
    $scope.$apply(function() {
      ev.preventDefault();
      // most modern browsers have ev.charCode for keypress events, but `which`
      // and `keyCode` can serve as fallbacks
      var charCode = (ev.charCode !== null) ? ev.charCode : (ev.which || ev.keyCode);
      var string = String.fromCharCode(charCode);
      $scope.characters.push(string);
      $scope.events.push({timestamp: ev.timeStamp, key: string});
    });
  });

  $scope.submit = function() {
    Response.save({
      sentence_id: $scope.sentence.id,
      participant_id: $scope.participant.id,
      keystrokes: $scope.events,
    }, function() {
      $scope.sentence.$get({
        id: 'next',
        participant_id: $scope.participant.id
      }, sentenceLoaded, sentenceFailed);
    });
  };
});

app.controller('conclusion', function($scope, $stateParams) {
  $scope.turkSubmitTo = $stateParams.turkSubmitTo;
  $scope.assignmentId = $stateParams.assignmentId;
});
