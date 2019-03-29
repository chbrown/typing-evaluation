/*jslint browser: true */ /*globals angular, cookies */

cookies.defaults = function() {
  // root path; expires in a month
  return {
    path: '/',
    expires: new Date(new Date().getTime() + 31 * 24 * 60 * 60 * 1000),
  };
};

(function(angular) {
  const app = angular.module('typing-evaluation-models', [
    'ngResource',
  ]);

  app.service('Sentence', ($resource) => {
    return $resource('/api/sentences/:id', {
      id: '@id',
    });
  });

  app.service('Administrator', ($resource) => {
    return $resource('/api/administrators/:id', {
      id: '@id',
    });
  });

  app.service('Participant', ($resource) => {
    return $resource('/api/participants/:id', {
      id: '@id',
    });
  });

  app.service('Response', ($resource) => {
    return $resource('/api/responses/:id', {
      id: '@id',
    });
  });
}(angular));
