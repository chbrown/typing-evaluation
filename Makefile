all: static/lib.min.js static/lib.max.js

# ng/experiment/demographics.schema.json: demographics.schema.yaml
# 	<$+ yaml2json | jq . >$@

# Use | (order-only prerequisites) to skip existing files
static/lib/%.min.js: | static/lib/%.js
	ng-annotate -a $| | closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET > $@

SCRIPTS = angular angular-resource \
	angular-ui-router ngStorage angular-plugins angular-translate \
	lodash textarea cookies tv4
static/lib.min.js: $(SCRIPTS:%=static/lib/%.min.js)
	closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET --js $+ > $@
static/lib.max.js: $(SCRIPTS:%=static/lib/%.js)
	cat $+ > $@
