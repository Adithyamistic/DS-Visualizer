// UI checks use a stub AR runtime; camera rendering needs a physical phone.
const { chromium } = require('C:/Users/adith/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
    const file = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    try {
        res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : 'text/html');
        res.end(fs.readFileSync(file));
    } catch { res.writeHead(404).end(); }
});

(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true,
        executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('https://**/*', route => route.fulfill({
            contentType: 'application/javascript', body: 'window.components = window.components || {}; window.AFRAME = { registerComponent(name, component) { window.components[name] = component; } };'
        }));
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.evaluate(() => {
            const video = document.createElement('video');
            Object.defineProperties(video, { videoWidth: { value: 640 }, videoHeight: { value: 480 } });
            const canvas = document.createElement('canvas');
            const source = { domElement: video, onResizeElement() {}, copyElementSizeTo() {} };
            document.body.append(video, canvas);
            window.testCamera = Object.assign({}, window.components['camera-view'], {
                el: { systems: { arjs: { _arSession: { arSource: source } } }, renderer: { domElement: canvas } }
            });
            window.testCamera.init();
            window.testCamera.tick();
        });
        await page.screenshot({ path: path.join(root, 'dist/ui-dock-mobile.png') });
        await page.locator('#stackMode').click();
        assert.equal(await page.locator('#stackMode').getAttribute('aria-pressed'), 'true');
        await page.locator('#valueInput').fill('42');
        await page.locator('#pushButton').click();
        assert.equal(await page.locator('#dataStatus').innerText(), 'Stack: [42]');
        await page.locator('#popButton').click();
        assert.equal(await page.locator('#dataStatus').innerText(), 'Stack: []');
        await page.locator('#popButton').click();
        assert.ok((await page.locator('#warning').innerText()).includes('UNDERFLOW'));
        await page.locator('#queueMode').click();
        await page.locator('#valueInput').fill('1');
        await page.locator('#enqueueButton').click();
        await page.locator('#valueInput').fill('2');
        await page.locator('#enqueueButton').click();
        await page.locator('#dequeueButton').click();
        assert.equal(await page.locator('#dataStatus').innerText(), 'Queue: [2]');
        // Check active controls, including the short screen shown in the bug report.
        for (const viewport of [{width:320,height:646}, {width:390,height:844}, {width:844,height:390}]) {
            await page.setViewportSize(viewport);
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const geometry = await page.evaluate(() => {
                window.testCamera.setZoom(1);
                const stage = document.getElementById('arViewport').getBoundingClientRect();
                const dock = document.getElementById('panel').getBoundingClientRect();
                const video = window.testCamera.source.domElement.getBoundingClientRect();
                const canvas = window.testCamera.el.renderer.domElement.getBoundingClientRect();
                return { stageBottom: stage.bottom, stageHeight: stage.height, dockTop: dock.top,
                    videoBottom: video.bottom, canvasBottom: canvas.bottom };
            });
            assert.ok(geometry.stageHeight > 0, 'Model area remains visible');
            assert.ok(geometry.stageBottom < geometry.dockTop, 'Model area ends above dock');
            assert.ok(geometry.videoBottom <= geometry.stageBottom + 1, 'Camera stays above controls at 1x');
            assert.equal(geometry.videoBottom, geometry.canvasBottom, 'Overlay matches camera');
            await page.evaluate(() => window.testCamera.setZoom(4));
            const clip = await page.evaluate(() => window.testCamera.source.domElement.style.clipPath);
            assert.ok(clip.startsWith('inset('), 'Zoomed view is clipped to model area');
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => window.testCamera.setZoom(1));
        await page.locator('#pseudocodeButton').click();
        assert.equal(await page.locator('#pseudocodePanel').isVisible(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#pseudocodePanel').isVisible(), false);
        await page.screenshot({ path: path.join(root, 'dist/ui-dock-mobile-active.png') });
        await page.locator('#panelToggle').click();
        assert.equal(await page.locator('#panelBody').isVisible(), false);
        await page.locator('#panelToggle').click();
        assert.equal(await page.locator('#panelBody').isVisible(), true);
        await page.locator('#backButton').click();
        assert.equal(await page.locator('#operations').isVisible(), false);
        for (const viewport of [{width:320,height:640}, {width:844,height:390}, {width:1280,height:800}]) {
            await page.setViewportSize(viewport);
            const box = await page.locator('#panel').boundingBox();
            assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1);
        }
        await page.screenshot({ path: path.join(root, 'dist/ui-dock-desktop.png') });
        assert.deepEqual(errors, []);
        console.log('UI checks passed: dock never overlaps camera, zoom clipping, mobile layouts, operations, dialog, collapse and reset.');
    } finally {
        await browser.close();
        server.close();
    }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
