const angular = require('angular')
require('angular-translate') // for 'pascalprecht.translate'

require('../angular-plugins') // for side-effect of loading 'misc-js/angular-plugins' module
require('../ngstorage') // for side-effect of loading 'ngStorage' module

const {CheckboxSequence} = require('./checkbox-sequence')
const {Cookies} = require('../cookies')
const cookies = new Cookies()

const app = angular.module('adminApp', [
  require('angular-resource'),
  'ngStorage',
  require('angular-ui-router'),
  'pascalprecht.translate', // for $translateProvider and | translate filters
  require('../models'),
  'misc-js/angular-plugins',
])

function stringifyResponse(res) {
  if (res.data.message) {
    return res.data.message
  }
  if (typeof res.data === 'string') {
    return res.data
  }
  return JSON.stringify(res.data)
}

app.directive('fixedflow', () => {
  /** This directive is intended to be used with a <nav> element, so that it
  drops out of flow, in the current position, but creates an empty shadow
  element to keep its place

  <nav fixedflow>
    <a href="/admin/individuals">Individuals</a>
    <a href="/admin/administrators">Administrators</a>
  </nav>
  */
  return {
    restrict: 'A',
    link: function(scope, el) {
      // set the el to "position: fixed" in case that's not in the css
      el.css('position', 'fixed')
      // placeholder is just a super simple empty shadow element
      const height = getComputedStyle(el[0]).height
      const placeholder = angular.element('<div>')
      placeholder.css('height', height)
      placeholder.addClass('fixedflow-placeholder')
      el.after(placeholder)
    },
  }
})

app.directive('checkboxSequence', () => {
  return {
    restrict: 'A',
    link: function(scope, el) {
      scope.checkbox_sequence = new CheckboxSequence(el[0])
    },
  }
})

app.directive('uiSrefActiveAny', ($state) => {
  return {
    restrict: 'A',
    scope: {
      uiSrefActiveAny: '=',
    },
    link: function(scope, el) {
      const activeClasses = scope.uiSrefActiveAny
      function updateSrefActiveAny() {
        for (const key in activeClasses) {
          const match = $state.includes(activeClasses[key])
          el.toggleClass(key, match)
        }
      }
      scope.$on('$stateChangeSuccess', updateSrefActiveAny)
    },
  }
})

app.config(($stateProvider, $locationProvider, $urlRouterProvider) => {
  $urlRouterProvider.otherwise(() => {
    // the returned value should be a url expressed relative to the page's base[href]
    return 'sentences/'
  })

  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: '/ui/admin/login.html',
    controller: 'login',
  })
  // sentences
  .state('sentences', {
    url: '/sentences',
    templateUrl: '/ui/admin/sentences/layout.html',
    abstract: true,
  })
  .state('sentences.list', {
    url: '/',
    templateUrl: '/ui/admin/sentences/list.html',
    controller: 'sentences.list',
  })
  .state('sentences.import', {
    url: '/import',
    templateUrl: '/ui/admin/sentences/import.html',
    controller: 'sentences.import',
  })
  // matches /import, so edit must come after import
  .state('sentences.edit', {
    url: '/{id}',
    templateUrl: '/ui/admin/sentences/edit.html',
    controller: 'sentences.edit',
  })
  // administrators
  .state('administrators', {
    url: '/administrators',
    templateUrl: '/ui/admin/administrators/layout.html',
    abstract: true,
  })
  .state('administrators.list', {
    url: '/',
    templateUrl: '/ui/admin/administrators/list.html',
    controller: 'administrators.list',
  })
  .state('administrators.edit', {
    url: '/{id}',
    templateUrl: '/ui/admin/administrators/edit.html',
    controller: 'administrators.edit',
  })
  // participants
  .state('participants', {
    url: '/participants',
    templateUrl: '/ui/admin/participants/layout.html',
    abstract: true,
  })
  .state('participants.list', {
    url: '/',
    templateUrl: '/ui/admin/participants/list.html',
    controller: 'participants.list',
  })
  .state('participants.edit', {
    url: '/{id}',
    templateUrl: '/ui/admin/participants/edit.html',
    controller: 'participants.edit',
  })
  // responses
  .state('responses', {
    url: '/responses',
    templateUrl: '/ui/admin/responses/layout.html',
    abstract: true,
  })
  .state('responses.list', {
    url: '/',
    templateUrl: '/ui/admin/responses/list.html',
    controller: 'responses.list',
  })

  $locationProvider.html5Mode(true)
})

app.config(($httpProvider) => {
  // trying to inject $state below creates a circular dependency conflict
  $httpProvider.interceptors.push(($q, $rootScope) => {
    return {
      responseError: function(res) {
        if (res.status == 401) {
          $rootScope.$broadcast('unauthorized', res)
        }
        return $q.reject(res)
      },
    }
  })
})

app.run(($rootScope, $state) => {
  $rootScope.$on('unauthorized', () => {
    $state.go('login')
  })
})

app.controller('login', ($scope, $flash, $window, AccessToken) => {
  $scope.submit = function() {
    const access_token = AccessToken.authenticateUser({
      email: $scope.email,
      password: $scope.password,
    })

    const promise = access_token.$promise.then(() => {
      cookies.set('user_access_token', access_token.token)
      setTimeout(() => {
        $window.history.back()
      }, 500)
      return 'Logged in; returning to previous page.'
    }, (res) => {
      const message = res.data.message || res.data.toString()
      return 'Failed to login. ' + message
    })
    $flash(promise)
  }
})

app.controller('sentences.list', ($scope, $q, $flash, Sentence) => {
  $scope.sentences = Sentence.query({active: true})

  $scope.delete = function(sentence) {
    const promise = sentence.$delete(() => {
      sentence.deleted = true
    }).then(() => {
      return 'Deleted sentence.'
    })
    $flash(promise)
  }

  $scope.deleteSelected = function() {
    const promises = $scope.sentences.filter((sentence) => {
      return sentence.selected && !sentence.deleted
    }).map((sentence) => {
      return sentence.$delete(() => {
        sentence.deleted = true
      })
    })
    const promise = $q.all(promises).then(() => {
      return 'Deleted ' + promises.length + ' sentences.'
    })
    $flash(promise)
  }
})

app.controller('sentences.edit', ($scope, $flash, $state, Sentence) => {
  $scope.sentence = Sentence.get($state.params)

  $scope.submit = function() {
    const promise = $scope.sentence.$save().then(() => {
      $state.go('.', {id: $scope.sentence.id}, {notify: false})
      return 'Saved sentence.'
    }, (res) => {
      return 'Error saving sentence. ' + stringifyResponse(res)
    })
    $flash(promise)
  }
})

app.controller('sentences.import', ($scope, $q, $flash, $state, Sentence) => {
  $scope.active = true
  $scope.language = 'en'

  $scope.prepare = function() {
    const texts = $scope.input.trim().split(/\n/)

    // find the maximum view_order in the sentences table
    Sentence.query({order: 'view_order', direction: 'DESC', limit: 1}, (sentences) => {
      const max_view_order = (sentences.length > 0) ? sentences[0].view_order : 0
      const next_view_order = max_view_order + 1
      // now construct all the sentences that will be inserted (if submitted)
      $scope.sentences = texts.map((text, i) => {
        return new Sentence({
          text: text,
          language: $scope.language,
          active: $scope.active,
          view_order: next_view_order + i,
        })
      })
    })
  }

  $scope.submit = function() {
    const promises = $scope.sentences.map((sentence) => {
      return sentence.$save()
    })
    const promise = $q.all(promises).then((res) => {
      return 'Inserted ' + res.length + ' sentences.'
    }, (res) => {
      return 'Error saving sentence. ' + stringifyResponse(res)
    })
    $flash(promise)
  }
})


app.controller('administrators.list', ($scope, $flash, Administrator) => {
  $scope.administrators = Administrator.query()

  $scope.delete = function(administrator) {
    const promise = administrator.$delete().then(() => {
      $scope.administrators.splice($scope.administrators.indexOf(administrator), 1)
      return 'Deleted administrator.'
    }, (res) => {
      return 'Error deleting administrator. ' + stringifyResponse(res)
    })
    $flash(promise)
  }
})


app.controller('administrators.edit', ($scope, $flash, $state, Administrator) => {
  $scope.administrator = Administrator.get({id: $state.params.id})

  $scope.submit = function() {
    const promise = $scope.administrator.$save().then(() => {
      $state.go('.', {id: $scope.administrator.id}, {notify: false})
      return 'Saved administrator.'
    }, (res) => {
      return 'Error saving administrator. ' + stringifyResponse(res)
    })
    $flash(promise)
  }
})


app.controller('participants.list', ($scope, $flash, Participant) => {
  $scope.participants = Participant.query()

  $scope.delete = function(participant) {
    const promise = participant.$delete().then(() => {
      $scope.participants.splice($scope.participants.indexOf(participant), 1)
      return 'Deleted participant.'
    }, (res) => {
      return 'Error deleting participant. ' + stringifyResponse(res)
    })
    $flash(promise)
  }
})


app.controller('participants.edit', ($scope, $flash, $state, Participant, Response) => {
  $scope.participant = Participant.get({id: $state.params.id})
  $scope.responses = Response.query({participant_id: $state.params.id})
})


app.controller('responses.list', ($scope, $flash, Response) => {
  $scope.responses = Response.query({limit: 100})
  $scope.accept = 'application/json;+boundary=LF' // default

  $scope.delete = function(response) {
    const promise = response.$delete().then(() => {
      $scope.responses.splice($scope.responses.indexOf(response), 1)
      return 'Deleted response.'
    }, (res) => {
      return 'Error deleting response. ' + stringifyResponse(res)
    })
    $flash(promise)
  }
})
