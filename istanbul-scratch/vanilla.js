function test() {return 123; return 321; }
var foo = function() {
    return 123; return 321; }

test();
test();
// test();