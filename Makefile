BABEL = node_modules/babel-cli/bin/babel.js

BABEL_OPTIONS = --presets babel-preset-es2015

MINIFIER = node_modules/minifier/index.js

MINIFIER_OPTIONS =

all: sw-demo.es5.min.js

clean:
	rm src/sw-demo.es5.js src/sw-demo.es5.min.js

src/sw-demo.es5.js: src/sw-demo.js
	$(BABEL) $(BABEL_OPTIONS) $^ -o $@

sw-demo.es5.min.js: src/sw-demo.es5.js
	$(MINIFIER) $(MINIFIER_OPTIONS) $^ -o src/$@
