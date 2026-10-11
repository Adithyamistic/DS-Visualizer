const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function element() {
    const values = new Map();
    return {
        disabled: true,
        addEventListener() {}, removeEventListener() {},
        style: {
            getPropertyValue: key => values.get(key)?.value || '',
            getPropertyPriority: key => values.get(key)?.priority || '',
            setProperty: (key, value, priority) => values.set(key, { value, priority })
        }
    };
}

let definition;
const elements = new Map();
const document = { body: element(), getElementById: id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
} };
const window = { innerWidth: 360, innerHeight: 800,
    addEventListener() {}, removeEventListener() {} };
vm.runInNewContext(fs.readFileSync(require.resolve('../camera-controls.js'), 'utf8'), {
    AFRAME: { registerComponent: (_, component) => { definition = component; } },
    document, window
});

const video = Object.assign(element(), { videoWidth: 640, videoHeight: 480 });
const canvas = element();
const originalResize = () => {};
const originalCopy = () => {};
const source = { domElement: video, onResizeElement: originalResize,
    copyElementSizeTo: originalCopy };
const view = Object.assign({}, definition, {
    el: { systems: { arjs: { _arSession: { arSource: source } } },
        renderer: { domElement: canvas } }
});
view.init();
view.tick();

function value(el, name) { return parseFloat(el.style.getPropertyValue(name)); }
function aligned() {
    for (const name of ['width', 'height', 'margin-left', 'margin-top']) {
        assert.equal(value(video, name), value(canvas, name), `Overlay ${name} matches camera`);
    }
}
assert.equal(value(video, 'width'), 360);
assert.equal(value(video, 'height'), 270);
assert.equal(value(video, 'margin-top'), 265);
assert.equal(view.out.disabled, true);
assert.equal(view.into.disabled, false);
aligned();

view.setZoom(2);
assert.equal(value(video, 'width'), 720);
assert.equal(value(video, 'margin-left'), -180);
aligned();
// AR.js repeatedly resizes its source: user zoom must survive that call.
source.onResizeElement();
assert.equal(value(video, 'width'), 720);
view.setZoom(100);
assert.equal(view.zoom, 4);
assert.equal(view.into.disabled, true);
view.setZoom(-100);
assert.equal(view.zoom, 1);

// Rotation uses actual stream dimensions and keeps the full frame visible.
window.innerWidth = 800;
window.innerHeight = 360;
view.tick();
assert.equal(value(video, 'width'), 480);
assert.equal(value(video, 'height'), 360);
aligned();
video.videoWidth = 480;
video.videoHeight = 640;
window.innerWidth = 360;
window.innerHeight = 800;
view.tick();
assert.equal(value(video, 'width'), 360);
assert.equal(value(video, 'height'), 480);
aligned();

// The bottom dock reserves its own area. Camera and overlay stay above it.
elements.set('arViewport', { getBoundingClientRect: () => ({ left: 12, top: 166, width: 336, height: 220 }) });
view.tick();
assert.equal(value(video, 'height'), 220);
assert.equal(value(video, 'margin-top'), 166);
assert.ok(value(video, 'margin-top') + value(video, 'height') <= 386);
view.setZoom(4);
assert.equal(video.style.getPropertyValue('clip-path'), canvas.style.getPropertyValue('clip-path'));
assert.ok(video.style.getPropertyValue('clip-path').includes('330px'));
view.setZoom(1);

// Metadata may not be available until after permission is granted.
video.videoWidth = 0;
view.tick();
assert.ok(Number.isFinite(value(video, 'width')));
video.videoWidth = 480;
let constraintCalls = 0;
const track = { getCapabilities: () => ({ zoom: { min: 1, max: 8 } }),
    applyConstraints: () => { constraintCalls++; return Promise.reject(new Error('Unsupported')); } };
video.srcObject = { getVideoTracks: () => [track] };
view.tick();
view.tick();
assert.equal(constraintCalls, 1);
view.remove();
assert.equal(source.onResizeElement, originalResize);
assert.equal(source.copyElementSizeTo, originalCopy);
console.log('Camera checks passed: full frame, aligned zoom, limits, rotation, metadata, unsupported hardware.');
