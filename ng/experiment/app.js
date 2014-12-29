/*jslint browser: true */ /*globals _, angular, cookies, LoggedInput */
var app = angular.module('experimentApp', [
  'ui.router',
  'pascalprecht.translate', // for $translateProvider and | translate filters
  'ngResource',
  'typing-evaluation-models',
]);

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
  $urlRouterProvider.otherwise('/instructions');

  $stateProvider
  .state('instructions', {
    url: '/instructions',
    templateUrl: '/ng/experiment/instructions.html',
  })
  .state('demographics', {
    url: '/demographics',
    templateUrl: '/ng/experiment/demographics.html',
    controller: 'demographics',
  })
  .state('sentence', {
    url: '/sentence/{id}',
    templateUrl: '/ng/experiment/sentence.html',
    controller: 'sentence',
  })
  .state('conclusion', {
    url: '/conclusion',
    templateUrl: '/ng/experiment/conclusion.html',
  });

  $locationProvider.html5Mode(true);
});

app.controller('demographics', function($scope, $state, Participant) {
  // For debugging:
  // $('[name=gender]').checked = true; $('[name=date_of_birth]').value = '1991-01-01'

  $scope.submit = function(ev) {
    var participant = new Participant({
      demographics: $scope.demographics,
    });

    participant.$save().then(function(res) {
      cookies.set('participant_id', participant.id);
      $state.go('sentence', {id: 'next'});
    }, function(res) {
      console.error(res);
    });
  };
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
      $state.go('.', {id: $scope.sentence.id}, {notify: false});
    }, function(res) {
      if (res.status == 404) {
        return $state.go('conclusion');
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
      $state.go('sentence', {id: 'next'});
    }, function(res) {
      console.error(res);
      // return 'Error saving sentence. ' + stringifyResponse(res);
    });
  };
});
