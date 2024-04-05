/// <reference path="fourslash.ts" />

// @module: nodenext

// @Filename: /node_modules/foo/package.json
//// {
////   "name": "foo",
////   "exports": {
////     "./*": "./dist/*.js"
////   }
//// }

// @Filename: /node_modules/foo/dist/blah.d.ts
//// export const blah = 0;

// @Filename: /index.mts
//// import { } from "foo//**/";

verify.completions({
  marker: "",
  isNewIdentifierLocation: true,
  exact: [
    { name: "blah", kind: "script", kindModifiers: "" },
  ]
});
