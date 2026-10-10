const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const moduleValue={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/campaign-dates.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:moduleValue,exports:moduleValue.exports,Intl,Date});
const {johannesburgDate,displayDate,displayTimestamp,weekStart}=moduleValue.exports;
test('South African task date rolls over at 22:00 UTC',()=>{
 assert.equal(johannesburgDate(new Date('2026-10-12T21:59:59Z')),'2026-10-12');
 assert.equal(johannesburgDate(new Date('2026-10-12T22:00:00Z')),'2026-10-13');
});
test('date-only campaign dates retain their day and Monday week grouping',()=>{
 assert.match(displayDate('2026-10-13'),/Tue.*13.*Oct.*2026/);
 assert.equal(weekStart('2026-10-13'),'2026-10-12');
 assert.equal(weekStart('2026-10-19'),'2026-10-19');
 assert.equal(weekStart('2026-10-18'),'2026-10-12');
});
test('database UTC completion timestamps show South African time',()=>{
 assert.equal(displayTimestamp('2026-10-13T08:00:00'),displayTimestamp('2026-10-13T08:00:00Z'));
 assert.match(displayTimestamp('2026-10-13T08:00:00'),/10:00/);
});
