// Test arrow function.
var arrowFn = foo => console.log(foo);

// Block arrow function
var blockArrowFn = foo => { return console.log(foo); var x = 123; }

// Basic generator function.
var gen1 = function*() {
    console.log("I won't be reached.");
}
gen1(); gen1(); gen1();

// Generator with suspend.
var gen2 = function*() {
    console.log("Hello.");
    yield 123;
    console.log("I won't be reached.");
}
gen2().next(); gen2().next(); gen2().next();

// Classes.
class FooClass {
    constructor() {
        console.log("Constructed!");
    }

    fn() {
        console.log("fn()!");
    }
}
new FooClass().fn(); new FooClass().fn();

// Annotations.
@FooClass
function annotated() {
    console.log("Not called.");
}

// Async function.
var asyncFn = async function() {
    await new Promise((resolve) => setTimeout(resolve, 10));
    console.log("Woot.");
    return;
}

// For loop.
for (var i = 0; i < 100; i++) { i; }

// Comprehensions.
var arr = ["hello", "world"];
var upper = (for (item of arr) item.toUpperCase());

// Computed property names.
var prop = "woot";
var obj = {
    [prop]: "hi"
}

asyncFn().then(function() {
    // Template literals.
    var tmpl = `hello "Sam!"`

    // Spread operator.
    // arrowFn(...[1,2,3]);
});
