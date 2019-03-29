/*jslint browser: true */ /*globals angular, cookies */
const app = angular.module('experimentApp', [
  'ngResource',
  'ui.router',
  'pascalprecht.translate', // for $translateProvider and | translate filters
  'typing-evaluation-models',
]);

app.filter('trustResourceUrl', ($sce) => {
  return function(string) {
    return $sce.trustAsResourceUrl(string);
  };
});

app.config(($provide) => {
  /** monkeypatch ui-router's injectable $state object */
  $provide.decorator('$state', ($delegate) => {
    // the argument to this function must be "$delegate"
    $delegate.goRel = function goRel(to, params, options) {
      const merged_params = angular.extend({}, $delegate.params, params);
      return $delegate.go(to, merged_params, options);
    };
    return $delegate;
  });
});

app.config(($translateProvider) => {
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

app.config(($urlRouterProvider, $stateProvider, $locationProvider) => {
  $urlRouterProvider.otherwise(() => {
    // $location is kind of broken (its getter functions return undefined) if
    // the current url is not under the current base[href]

    // the returned value should be a url expressed relative to the page's base[href]
    return 'consent' + window.location.search;
  });

  const PARAMS = '?' + ['assignmentId', 'hitId', 'workerId', 'turkSubmitTo', 'demographics', 'consent', 'batch'].join('&');

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
app.directive('uiSrefRel', ($state) => {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      el.attr('href', $state.href(attrs.uiSrefRel, $state.params));
    },
  };
});

app.controller('consent', ($scope, $state, Participant) => {
  $scope.mturk_preview = $state.params.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE';

  $scope.submit = function() {
    const participant = new Participant({
      parameters: $state.params,
      demographics: {},
    });

    participant.$save().then(() => {
      cookies.set('participant_id', participant.id);
      $state.goRel('instructions');
    }, (res) => {
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

app.controller('demographics', ($scope, $state, Participant) => {
  $scope.participant = new Participant({id: cookies.get('participant_id')});
  $scope.demographics = {};

  $scope.submit = function() {
    $scope.participant.demographics = $scope.demographics;
    $scope.participant.$save().then(() => {
      $state.goRel('sentence', {id: 'next'});
    }, (res) => {
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

app.controller('sentence', ($scope, $state, Sentence, Participant, Response) => {
  // we don't need to load the whole participant
  $scope.participant = new Participant({id: cookies.get('participant_id')});

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

  $scope.sentence = Sentence.get({
    id: $state.params.id,
    participant_id: $scope.participant.id,
  }, sentenceLoaded, sentenceFailed);

  $scope.$watch('sentence.id', () => {
    if ($scope.sentence.$resolved) {
      $state.goRel('sentence', {id: $scope.sentence.id}, {notify: false});
    }
  });

  document.addEventListener('keydown', (ev) => {
    // handle special characters that don't equate to a keypress event
    if (ev.which == 8) { // backspace
      // backspace is a special case: it's the only logged control character
      ev.preventDefault();
      $scope.$apply(() => {
        $scope.characters.pop();
        $scope.events.push({timestamp: ev.timeStamp, key: 'backspace'});
      });
    }
    else if (ev.which == 13) { // enter
      ev.preventDefault();
      $scope.$apply(() => {
        $scope.submit(ev);
      });
    }
    // but most key events should drop through to the keypress handler below
  });
  document.addEventListener('keypress', (ev) => {
    // keypress is only called for non-meta keys (not for shift / ctrl / super / command)
    $scope.$apply(() => {
      ev.preventDefault();
      // most modern browsers have ev.charCode for keypress events, but `which`
      // and `keyCode` can serve as fallbacks
      const charCode = (ev.charCode !== null) ? ev.charCode : (ev.which || ev.keyCode);
      const string = String.fromCharCode(charCode);
      $scope.characters.push(string);
      $scope.events.push({timestamp: ev.timeStamp, key: string});
    });
  });

  $scope.submit = function() {
    Response.save({
      sentence_id: $scope.sentence.id,
      participant_id: $scope.participant.id,
      keystrokes: $scope.events,
    }, () => {
      $scope.sentence.$get({
        id: 'next',
        participant_id: $scope.participant.id,
      }, sentenceLoaded, sentenceFailed);
    });
  };
});

app.controller('conclusion', ($scope, $stateParams) => {
  $scope.turkSubmitTo = $stateParams.turkSubmitTo;
  $scope.assignmentId = $stateParams.assignmentId;
});
