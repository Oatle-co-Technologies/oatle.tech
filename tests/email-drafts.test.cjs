const {test}=require('node:test'); const assert=require('node:assert/strict'); const fs=require('node:fs'); const vm=require('node:vm'); const ts=require('typescript');
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/email-drafts.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:mod,exports:mod.exports});
const {parseEmailDraft,emailDraftKey}=mod.exports;
test('draft reload restores writing and original reply context',()=>{const original={recipient:'person@example.com',subject:'Re: hello',body:'Unfinished writing',reply:{uid:9,uid_validity:7,view:'inbox'}};assert.equal(JSON.stringify(parseEmailDraft(JSON.stringify(original))),JSON.stringify(original));});
test('corrupt saved draft does not break the composer',()=>{assert.equal(parseEmailDraft('{broken').body,'');assert.equal(parseEmailDraft(JSON.stringify({recipient:4,subject:'hello',body:'test'})).body,'');});
test('draft storage is separate for each staff account',()=>{assert.notEqual(emailDraftKey(7),emailDraftKey(9));});
test('invalid reply metadata is not restored',()=>{assert.equal(parseEmailDraft(JSON.stringify({recipient:'',subject:'',body:'keep this',reply:{uid:-1,uid_validity:1,view:'inbox'}})).reply,undefined);});
