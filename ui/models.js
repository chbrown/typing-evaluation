/*jslint browser: true */ /*globals _, angular, cookies */

function t_(url) {
  return url + '?t_=' + (Math.random() * 1000 | 0);
}

cookies.defaults = function() {
  // root path; expires in a month
  return {
    path: '/',
    expires: new Date(new Date().getTime() + 31*24*60*60*1000),
  };
};

(function(angular) {
  var app = angular.module('typing-evaluation-models', [
    'ngResource',
  ]);

  app.service('Sentence', function($resource) {
    return $resource('/api/sentences/:id', {
      id: '@id',
    });
  });

  app.service('Administrator', function($resource) {
    return $resource('/api/administrators/:id', {
      id: '@id',
    });
  });

  app.service('Participant', function($resource) {
    return $resource('/api/participants/:id', {
      id: '@id',
    });
  });

  app.service('Response', function($resource) {
    return $resource('/api/responses/:id', {
      id: '@id',
    });
  });
})(angular);
