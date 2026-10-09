const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function harness(path) {
  let pathname = path, cursor = 0;
  const refs = [], effects = [], calls = [];
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/use-record-page.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, require(name) {
    if (name === 'react') return {
      useRef(initial) { const index = cursor++; return refs[index] ||= { current: initial }; },
      useEffect(callback) { effects.push(callback); },
    };
    if (name === 'next/navigation') return { usePathname: () => pathname, useRouter: () => ({ push: url => calls.push(['navigate', url]) }) };
    if (name === 'next/link') return { default: 'Link' };
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    throw Error(name);
  } });
  return { calls, render(records = [], loading = false, ready = true) {
    cursor = 0; effects.length = 0;
    const result = module.exports.useRecordPage({ base: '/dashboard/clients', records, loading, ready,
      onNew: () => calls.push(['new']), onEdit: record => calls.push(['edit', record.id]), onEmail: record => calls.push(['compose', record.id]),
    });
    effects.forEach(effect => effect()); return result;
  } };
}
test('list actions navigate to dedicated new/edit/email pages', () => {
  const h = harness('/dashboard/clients'); const page = h.render();
  assert.equal(page.showList, true);
  page.open('edit', 7); page.open('email', 7); page.open('new');
  assert.deepEqual(h.calls, [['navigate','/dashboard/clients/7/edit'],['navigate','/dashboard/clients/7/email'],['navigate','/dashboard/clients/new']]);
});
test('direct edit waits for data and initializes only the selected record once', () => {
  const h = harness('/dashboard/clients/7/edit');
  assert.equal(h.render([], true).showList, false);
  const records = [{id:3},{id:7}]; h.render(records); h.render(records);
  assert.deepEqual(h.calls, [['edit',7]]);
});
test('email page opens a composer, without sending anything, and isolates the record', () => {
  const h = harness('/dashboard/clients/7/email');const page = h.render([{id:3},{id:7}]);
  assert.equal(page.id,7);assert.equal(page.isDetail,true);assert.equal(page.showList,true);
  assert.deepEqual(h.calls,[['compose',7]]);page.back();assert.deepEqual(h.calls.at(-1),['navigate','/dashboard/clients']);
});
test('new page hides existing records and missing records do not initialize forms', () => {
  const h = harness('/dashboard/clients/new');assert.equal(h.render().showList,false);assert.deepEqual(h.calls,[['new']]);
  const missing = harness('/dashboard/clients/99/edit');missing.render([{id:7}]);assert.deepEqual(missing.calls,[]);
});
test('edit waits for related form options before initializing', () => {
  const h=harness('/dashboard/clients/7/edit');h.render([{id:7}],false,false);assert.deepEqual(h.calls,[]);
  h.render([{id:7}],false,true);assert.deepEqual(h.calls,[['edit',7]]);
});
