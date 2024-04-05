//// [tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInTemplates07_ES5.ts] ////

//// [unicodeExtendedEscapesInTemplates07_ES5.ts]
// ES6 Spec - 10.1.1 Static Semantics: UTF16Encoding (cp)
//  1. Assert: 0 ≤ cp ≤ 0x10FFFF.
var x = `\u{110000}`;


//// [unicodeExtendedEscapesInTemplates07_ES5.js]
// ES6 Spec - 10.1.1 Static Semantics: UTF16Encoding (cp)
//  1. Assert: 0 ≤ cp ≤ 0x10FFFF.
var x = "\\u{110000}";
