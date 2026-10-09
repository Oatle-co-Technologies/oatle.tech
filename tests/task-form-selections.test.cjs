const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function formHarness() {
  const states = []; let cursor = 0;
  const react = {
    useEffect() {},
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/dashboard/tasks/tasks.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, process: { env: {} }, require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === '@/lib/auth-context') return { useAuth: () => ({ staff: { id: 1, access_level: 'admin' } }) };
    if (name === '@/components/dashboard/BackToDashboard') return { default: () => null };
    throw Error(name);
  } });
  function render() { cursor = 0; return module.exports.default(); }
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
  }
  find(render(), node => node.type === 'button' && String(node.props.children).includes('Add Task')).props.onClick();
  return {
    change(name, value) { find(render(), node => node.props?.name === name).props.onChange({ target: { name, value } }); },
    value() { return states.find(value => value && typeof value === 'object' && 'product_service_id' in value && 'priority' in value); },
  };
}
test('choosing product after project preserves project and assignee', () => {
  const h = formHarness(); h.change('assigned_to', '2'); h.change('project_id', '7'); h.change('product_id', '3');
  assert.equal(h.value().project_id, '7'); assert.equal(h.value().assigned_to, '2');
});
test('choosing assignee after a task preserves the selected task', () => {
  const h = formHarness(); h.change('product_id', '3'); h.change('product_service_id', '4'); h.change('assigned_to', '2');
  assert.equal(h.value().product_service_id, '4');
});
test('switching task types and back preserves previous choices', () => {
  const h = formHarness(); h.change('project_id', '7'); h.change('product_id', '3'); h.change('task_type', 'service'); h.change('service_id', '8'); h.change('task_type', 'product');
  assert.equal(h.value().project_id, '7'); assert.equal(h.value().product_id, '3'); assert.equal(h.value().service_id, '8');
});
