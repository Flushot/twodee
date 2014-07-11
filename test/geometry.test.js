var test = require('tap').test;
var geometry = require('../lib/geometry');

test('Point', function(t) {
	var Point = geometry.Point;
	t.ok(Point);
});
