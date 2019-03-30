const angular = require('angular')

const moduleName = 'typing-evaluation-models'
angular.module(moduleName, [require('angular-resource')]).
service('Sentence', $resource => $resource('/api/sentences/:id', {id: '@id'})).
service('Administrator', $resource => $resource('/api/administrators/:id', {id: '@id'})).
service('Participant', $resource => $resource('/api/participants/:id', {id: '@id'})).
service('Response', $resource => $resource('/api/responses/:id', {id: '@id'}))

module.exports = moduleName
