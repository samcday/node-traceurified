var fn = () => 123;
var uncalled = foo => 123;
var block = () => { console.log(); }

var foo = function*() { 
    console.log("I get called. See?");
    true ? fn() : console.log("Dead branch.");
    yield true ? fn() : console.log("Dead branch.");
    console.log("I don't get called.");
}

foo().next();
foo().next();
