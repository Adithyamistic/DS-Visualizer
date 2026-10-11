/* Keep the camera feed and marker overlay in the same fitted viewport.
 * Display zoom works even when Android WebView does not expose hardware zoom.
 */
AFRAME.registerComponent("camera-view", {
    init: function () {
        this.zoom = 1;
        this.source = null;
        this.resetTracks = new WeakSet();
        this.controls = document.getElementById("cameraControls");
        this.out = document.getElementById("zoomOut");
        this.into = document.getElementById("zoomIn");
        this.reset = document.getElementById("zoomReset");
        this.level = document.getElementById("zoomLevel");
        this.hint = document.getElementById("cameraHint");
        this.onOut = () => this.setZoom(this.zoom - 0.25);
        this.onIn = () => this.setZoom(this.zoom + 0.25);
        this.onReset = () => this.setZoom(1);
        this.onError = () => {
            this.hint.textContent = "Camera unavailable. Check camera permission.";
            this.out.disabled = this.into.disabled = this.reset.disabled = true;
        };
        this.out.addEventListener("click", this.onOut);
        this.into.addEventListener("click", this.onIn);
        this.reset.addEventListener("click", this.onReset);
        window.addEventListener("camera-error", this.onError);
    },

    setZoom: function (value) {
        this.zoom = Math.min(4, Math.max(1, value));
        this.resizeView();
    },

    tick: function () {
        const system = this.el.systems.arjs;
        const source = system && system._arSession && system._arSession.arSource;
        if (!source || !source.domElement) return;

        if (source !== this.source) {
            this.restoreSource();
            this.source = source;
            this.zoom = 1;
            this.originalResize = source.onResizeElement;
            this.originalCopy = source.copyElementSizeTo;
            // AR.js resizes every frame; use the same layout for all its copies.
            source.onResizeElement = () => this.resizeView();
            source.copyElementSizeTo = (element) => {
                if (element === document.body) return;
                this.copyLayout(element);
            };
        }
        this.resizeView();
        this.resetHardwareZoom(source.domElement);
    },

    resizeView: function () {
        const video = this.source && this.source.domElement;
        if (!video || !video.videoWidth || !video.videoHeight) return;
        const viewport = document.getElementById("arViewport");
        const bounds = viewport && viewport.getBoundingClientRect ? viewport.getBoundingClientRect() :
            { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        if (bounds.width <= 0 || bounds.height <= 0) return;
        const scale = Math.min(bounds.width / video.videoWidth,
            bounds.height / video.videoHeight) * this.zoom;
        const width = video.videoWidth * scale;
        const height = video.videoHeight * scale;
        const left = bounds.left + (bounds.width - width) / 2;
        const top = bounds.top + (bounds.height - height) / 2;
        this.layout = {
            position: "fixed", left: "0px", top: "0px",
            width: width + "px", height: height + "px",
            "margin-left": left + "px",
            "margin-top": top + "px",
            // Clip both layers to the model area even when the user zooms in.
            "clip-path": `inset(${Math.max(0, bounds.top - top)}px ${Math.max(0, left + width - bounds.left - bounds.width)}px ${Math.max(0, top + height - bounds.top - bounds.height)}px ${Math.max(0, bounds.left - left)}px)`
        };
        this.copyLayout(video);
        if (this.el.renderer) this.copyLayout(this.el.renderer.domElement);
        this.level.textContent = this.zoom.toFixed(2).replace(/0$/, "") + "×";
        this.out.disabled = this.zoom <= 1;
        this.into.disabled = this.zoom >= 4;
        this.reset.disabled = this.zoom === 1;
        this.hint.textContent = "1× shows the full view";
    },

    copyLayout: function (element) {
        if (!element || !this.layout) return;
        Object.entries(this.layout).forEach(([property, value]) => {
            if (element.style.getPropertyValue(property) !== value ||
                element.style.getPropertyPriority(property) !== "important") {
                element.style.setProperty(property, value, "important");
            }
        });
    },

    resetHardwareZoom: function (video) {
        const stream = video.srcObject;
        const track = stream && stream.getVideoTracks && stream.getVideoTracks()[0];
        if (!track || this.resetTracks.has(track)) return;
        this.resetTracks.add(track);
        // Some camera drivers retain the previous zoom level between sessions.
        // Failure is harmless: display zoom remains available on every device.
        try {
            const capabilities = track.getCapabilities && track.getCapabilities();
            const range = capabilities && capabilities.zoom;
            if (range && Number.isFinite(range.min) && track.applyConstraints) {
                Promise.resolve(track.applyConstraints({ advanced: [{ zoom: range.min }] }))
                    .catch(() => {});
            }
        } catch (_) { /* Older WebViews may not expose camera capabilities. */ }
    },

    restoreSource: function () {
        if (!this.source) return;
        this.source.onResizeElement = this.originalResize;
        this.source.copyElementSizeTo = this.originalCopy;
        this.layout = null;
    },

    remove: function () {
        this.restoreSource();
        this.out.removeEventListener("click", this.onOut);
        this.into.removeEventListener("click", this.onIn);
        this.reset.removeEventListener("click", this.onReset);
        window.removeEventListener("camera-error", this.onError);
    }
});
