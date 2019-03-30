const angular = require('angular')

angular.module('typing-evaluation-models', [
  require('angular-resource'),
]).
service('Sentence', $resource => $resource('/api/sentences/:id', {id: '@id'})).
service('Administrator', $resource => $resource('/api/administrators/:id', {id: '@id'})).
service('Participant', $resource => $resource('/api/participants/:id', {id: '@id'})).
service('Response', $resource => $resource('/api/responses/:id', {id: '@id'}))
