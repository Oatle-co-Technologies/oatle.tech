const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const moduleValue = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/mail-date.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { module: moduleValue, exports: moduleValue.exports, Intl, Date },
);

const { formatEmailDate } = moduleValue.exports;

test("UTC email timestamps display in South African time", () => {
  assert.match(formatEmailDate("2026-11-02T12:27:00Z"), /14:27/);
  assert.match(formatEmailDate("Mon, 02 Nov 2026 12:27:00 +0000"), /14:27/);
});

test("missing and invalid email timestamps have a safe display value", () => {
  assert.equal(formatEmailDate(undefined), "Date unavailable");
  assert.equal(formatEmailDate(""), "Date unavailable");
  assert.equal(formatEmailDate("not a timestamp"), "Date unavailable");
});
