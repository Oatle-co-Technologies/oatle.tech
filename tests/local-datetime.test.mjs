import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const moduleUnderTest = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/local-datetime.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module: moduleUnderTest, exports: moduleUnderTest.exports, Date });
const { toLocalDateTime } = moduleUnderTest.exports;
test('lead date can be opened and saved without shifting the appointment', () => {
  process.env.TZ = 'Africa/Johannesburg';
  assert.equal(toLocalDateTime('2026-11-10T22:30:00Z'), '2026-11-11T00:30');
  assert.equal(toLocalDateTime('2026-11-10T22:30:00'), '2026-11-11T00:30');
  assert.equal(new Date(toLocalDateTime('2026-11-10T22:30:00Z')).toISOString(), '2026-11-10T22:30:00.000Z');
});
test('offsets and invalid or empty dates are handled', () => {
  process.env.TZ = 'Africa/Johannesburg';
  assert.equal(toLocalDateTime('2026-11-11T00:30:00+02:00'), '2026-11-11T00:30');
  assert.equal(toLocalDateTime(null), '');
  assert.equal(toLocalDateTime('invalid'), '');
});
