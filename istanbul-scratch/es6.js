var foo = () => Promise.resolve(123);

var async = async function() {
    await foo(); true ? console.log("yes.") : console.log("no.");
    return 123;
    return Math.min(123, 123);
    await foo();
}

async();

// var gen = function*() {
//     yield 123;
//     yield 123;
//     yield 123;
// }

// gen().next();
