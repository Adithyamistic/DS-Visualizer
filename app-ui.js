const controlPanel = document.getElementById("panel");
const panelToggle = document.getElementById("panelToggle");
const structureButtons = [document.getElementById("stackMode"), document.getElementById("queueMode")];

// Reserve space for the dock instead of floating it over the AR model.
const updateDockSize = () => {
    document.documentElement.style.setProperty("--dock-height", controlPanel.getBoundingClientRect().height + "px");
};
new ResizeObserver(updateDockSize).observe(controlPanel);
window.addEventListener("resize", updateDockSize);
updateDockSize();

panelToggle.addEventListener("click", () => {
    const collapsed = controlPanel.classList.toggle("isCollapsed");
    panelToggle.textContent = collapsed ? "+" : "−";
    panelToggle.setAttribute("aria-expanded", String(!collapsed));
    panelToggle.setAttribute("aria-label", collapsed ? "Expand controls" : "Minimize controls");
});

structureButtons.forEach(button => button.addEventListener("click", () => {
    controlPanel.classList.add("hasMode");
    structureButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
}));
document.getElementById("backButton").addEventListener("click", () => {
    controlPanel.classList.remove("hasMode");
    structureButtons.forEach(item => item.setAttribute("aria-pressed", "false"));
});
marker.addEventListener("markerFound", () => document.querySelector(".trackingCard").classList.add("isTracked"));
marker.addEventListener("markerLost", () => document.querySelector(".trackingCard").classList.remove("isTracked"));

// Focus stays in the algorithm dialog until it is closed.
const algorithmDialog = document.getElementById("pseudocodePanel");
let previousFocus;
const dialogObserver = new MutationObserver(() => {
    const open = algorithmDialog.style.display === "block";
    controlPanel.inert = open;
    document.getElementById("cameraControls").inert = open;
    if (open) {
        previousFocus = document.activeElement;
        algorithmDialog.querySelector("button").focus();
    } else if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
    }
});
dialogObserver.observe(algorithmDialog, { attributes: true, attributeFilter: ["style"] });
algorithmDialog.addEventListener("keydown", event => {
    if (event.key === "Escape") hidePseudocode();
    if (event.key === "Tab") {
        event.preventDefault();
        algorithmDialog.querySelector("button").focus();
    }
});
