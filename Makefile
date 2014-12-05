all: demographics.schema.json static/lib.min.js static/lib.max.js

demographics.schema.json: demographics.schema.yaml
	<$+ yaml2json | jq . >$@

# Use | (order-only prerequisites) to skip existing files
static/lib/%.min.js: | static/lib/%.js
	ng-annotate -a $| | closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET > $@

SCRIPTS = lodash angular angular-resource angular-ui-router ngStorage angular-plugins textarea cookies
static/lib.min.js: $(SCRIPTS:%=static/lib/%.min.js)
	closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET --js $+ > $@
static/lib.max.js: $(SCRIPTS:%=static/lib/%.js)
	cat $+ > $@
