/*jslint browser: true */ /*globals _, angular */
var app = angular.module('adminApp', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'misc-js/angular-plugins',
  'typing-evaluation-models',
]);

app.config(function($stateProvider, $locationProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/sentences/');

  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: '/ng/admin/login.html',
    controller: 'login',
  })
  .state('sentences', {
    url: '/sentences/',
    templateUrl: '/ng/admin/sentences/list.html',
    controller: 'sentences',
  })
  .state('sentence', {
    url: '/sentences/{id}',
    templateUrl: '/ng/admin/sentences/edit.html',
    controller: 'sentence'
  })
  .state('participants', {
    url: '/participants/',
    templateUrl: '/ng/admin/participants/list.html',
    controller: 'participants',
  })
  .state('participant', {
    url: '/participants/{id}',
    templateUrl: '/ng/admin/participants/edit.html',
    controller: 'participant'
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

app.controller('sentences', function($scope, $flash, Sentence) {
  $scope.sentences = Sentence.query({active: true});

  $scope.delete = function(sentence) {
    var promise = sentence.$delete().then(function(res) {
      $scope.sentences.splice($scope.sentences.indexOf(sentence), 1);
      return 'Deleted';
    }, function(res) {
      return 'Error deleting sentence. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});

app.controller('sentence', function($scope, $flash, $state, Sentence) {
  $scope.sentence = Sentence.get($state.params);

  $scope.submit = function(ev) {
    var promise = $scope.sentence.$save().then(function(res) {
      $state.go('.', {id: $scope.sentence.id}, {notify: false});
      return 'Saved.';
    }, function(res) {
      return 'Error saving sentence. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});

app.controller('participants', function($scope, $flash, Participant) {
  $scope.participants = Participant.query();

  $scope.delete = function(participant) {
    var promise = participant.$delete().then(function(res) {
      $scope.participants.splice($scope.participants.indexOf(participant), 1);
      return 'Deleted';
    }, function(res) {
      return 'Error deleting participant. ' + stringifyResponse(res);
    });
    $flash(promise);
  };
});

app.controller('participant', function($scope, $flash, $state, Participant, Response) {
  $scope.participant = Participant.get({id: $state.params.id});
  $scope.responses = Response.query({participant_id: $state.params.id});
});
