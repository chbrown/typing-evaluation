all: ui/compiled/experiment.min.js ui/site.css

%.css: %.less
	lessc $+ | cleancss --keep-line-breaks --skip-advanced -o $@

ui/compiled/experiment.min.js: ui/lib/angular.min.js ui/lib/angular-resource.min.js ui/lib/angular-ui-router.min.js \
		ui/lib/angular-translate.min.js ui/lib/cookies.js ui/loggedinput.js ui/models.js ui/experiment/app.js
	cat $+ | ng-annotate -a - | closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET > $@
