/*jslint browser: true */ /*globals _, angular */
var app = angular.module('experimentApp', [
  'ui.router',
  'pascalprecht.translate', // for $translateProvider and | translate filters
  'ngResource',
]);

app.service('User', function($resource) {
  return $resource('/api/users/:id', {
    id: '@id',
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
  $urlRouterProvider.otherwise('/experiment/instructions');

  $stateProvider
  .state('instructions', {
    url: '/instructions',
    templateUrl: '/ng/experiment/instructions.html',
    controller: 'instructions',
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
    controller: 'conclusion'
  });

  $locationProvider.html5Mode(true);
});

app.controller('instructions', function($scope) {
  // not very complicated at the moment; might need i18n, though
});

app.controller('demographics', function($scope, $http, $state) {
  // $http.get('/ng/experiment/demographics.schema.json').then(function(res) {
  //   $scope.schema = res.data;
  // }, function(res) {
  //   console.error('Error loading demographics schema');
  // });

  $scope.submit = function(ev) {
    $state.go('sentence', {id: 1});
  };
});
