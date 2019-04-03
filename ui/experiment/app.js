const angular = require('angular')
require('angular-translate') // for 'pascalprecht.translate'

const {Cookies} = require('../cookies')
const cookies = new Cookies()

const app = angular.module('experimentApp', [
  require('angular-resource'),
  require('angular-ui-router'),
  'pascalprecht.translate', // for $translateProvider and | translate filters
  require('../models'),
])

app.filter('trustResourceUrl', ($sce) => {
  return function(string) {
    return $sce.trustAsResourceUrl(string)
  }
})

app.config(($provide) => {
  /** monkeypatch ui-router's injectable $state object */
  $provide.decorator('$state', ($delegate) => {
    // the argument to this function must be "$delegate"
    $delegate.goRel = function goRel(to, params, options) {
      const merged_params = angular.extend({}, $delegate.params, params)
      return $delegate.go(to, merged_params, options)
    }
    return $delegate
  })
})

app.config(($translateProvider) => {
  // http://angular-translate.github.io/docs/#/guide
  // $translateProvider.translations('en', {
  //   'Gender': 'Gender',
  //   'Date of birth': 'Date of birth',
  // });

  $translateProvider.translations('es', {
    'Gender': 'Género',
    'Date of birth': 'Fecha de nacimiento',
  })

  $translateProvider.preferredLanguage('en')
})

app.config(($urlRouterProvider, $stateProvider, $locationProvider) => {
  $urlRouterProvider.otherwise(() => {
    // $location is kind of broken (its getter functions return undefined) if
    // the current url is not under the current base[href]

    // the returned value should be a url expressed relative to the page's base[href]
    return 'consent' + window.location.search
  })

  const PARAMS = '?' + ['assignmentId', 'hitId', 'workerId', 'turkSubmitTo', 'demographics', 'consent', 'batch'].join('&')

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
  })

  $locationProvider.html5Mode(true)
})

/** a[ui-sref-rel="other_state"]

Simplified version of ui-sref because ui-sref doesn't actually inherit the
current state params. Goes well with the $state.goRel function declared above.
*/
app.directive('uiSrefRel', ($state) => {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      el.attr('href', $state.href(attrs.uiSrefRel, $state.params))
    },
  }
})

app.controller('consent', ($scope, $state, Participant) => {
  $scope.mturk_preview = $state.params.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE'

  $scope.submit = function() {
    const participant = new Participant({
      parameters: $state.params,
      demographics: {},
    })

    participant.$save().then(() => {
      cookies.set('participant_id', participant.id)
      $state.goRel('instructions')
    }, (res) => {
      console.error(res)
    })
  }

  if ($state.params.consent == 'skip') {
    $scope.submit()
  }
  else {
    $scope.enabled = true
  }
})

app.controller('demographics', ($scope, $state, Participant) => {
  $scope.participant = new Participant({id: cookies.get('participant_id')})
  $scope.demographics = {}

  $scope.submit = function() {
    $scope.participant.demographics = $scope.demographics
    $scope.participant.$save().then(() => {
      $state.goRel('sentence', {id: 'next'})
    }, (res) => {
      console.error(res)
    })
  }

  if ($state.params.demographics) {
    $scope.enabled = true
  }
  else {
    $scope.submit()
  }
})

app.controller('sentence', ($scope, $state, $timeout, Sentence, Participant, Response) => {
  // we don't need to load the whole participant
  $scope.participant = new Participant({id: cookies.get('participant_id')})

  function sentenceLoaded() {
    // reset input
    $scope.content = ''
    $scope.keystrokes = []
  }

  function sentenceFailed(res) {
    if (res.status == 404) {
      return $state.goRel('conclusion')
    }
    console.error('Failed to fetch sentence', res)
  }

  $scope.sentence = Sentence.get({
    id: $state.params.id,
    participant_id: $scope.participant.id,
  }, sentenceLoaded, sentenceFailed)

  $scope.$watch('sentence.id', () => {
    if ($scope.sentence.$resolved) {
      $state.goRel('sentence', {id: $scope.sentence.id}, {notify: false})
    }
  })

  $scope.inputBlur = function(ev) {
    // immediately(-ish) refocus input whenever it loses focus
    $timeout(() => {
      ev.target.focus()
    }, 100)
  }

  function submit() {
    Response.save({
      sentence_id: $scope.sentence.id,
      participant_id: $scope.participant.id,
      keystrokes: $scope.keystrokes,
      content: $scope.content,
    }, () => {
      $scope.sentence.$get({
        id: 'next',
        participant_id: $scope.participant.id,
      }, sentenceLoaded, sentenceFailed)
    })
  }

  $scope.keyEvent = function(ev) {
    const {type, timeStamp, key, location} = ev
    $scope.keystrokes.push({type, timeStamp, key, location})

    if (type == 'keyup' && key == 'Enter') {
      // 'Enter' is the only intercepted control character
      ev.preventDefault()
      submit()
    }
  }
})

app.controller('conclusion', ($scope, $stateParams) => {
  $scope.turkSubmitTo = $stateParams.turkSubmitTo
  $scope.assignmentId = $stateParams.assignmentId
})
