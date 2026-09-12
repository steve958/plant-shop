const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let location, navigation, busy = false, nextFrame = 0;
const frames = new Map(), listeners = new Map();
let effects = [];
const window = {
 history: { scrollRestoration: 'auto' }, scrollX: 0, scrollY: 0,
 requestAnimationFrame(fn) { frames.set(++nextFrame, fn); return nextFrame; },
 cancelAnimationFrame(id) { frames.delete(id); },
 scrollTo({left = 0, top = 0}) { this.scrollX = left; this.scrollY = top; },
 addEventListener(name, fn) { listeners.set(name, fn); },
 removeEventListener(name) { listeners.delete(name); }
};
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync('src/components/RouteScroll.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(source, { exports: exportsObject, window, document: { querySelector: () => busy, getElementById: () => null }, require(name) {
 if (name === 'react') return { useLayoutEffect(fn) { effects.push(fn()); } };
 return { useLocation: () => location, useNavigationType: () => navigation };
}});
function tick() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); }
function navigate(key, type) { effects.forEach(fn => fn?.()); effects = []; location = { key, hash: '' }; navigation = type; exportsObject.default(); }
navigate('catalogue', 'PUSH'); tick();
window.scrollY = 1850; listeners.get('scroll')();
navigate('article', 'PUSH'); tick(); assert.equal(window.scrollY, 0);
busy = true; navigate('catalogue', 'POP'); tick(); assert.equal(window.scrollY, 0);
busy = false; tick(); assert.equal(window.scrollY, 1850);
navigate('other-catalogue', 'PUSH'); tick(); assert.equal(window.scrollY, 0);
navigate('catalogue', 'POP'); tick(); assert.equal(window.scrollY, 1850);
console.log('Passed: new pages start at top; Back waits for catalogue loading and restores its saved position.');
