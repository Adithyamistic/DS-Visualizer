const scene = document.querySelector("a-scene");
const target = document.querySelector("[mindar-image-target]");
const status = document.querySelector("#status");

target.addEventListener("targetFound", () => {
    console.log("TARGET FOUND!");

    status.innerText = "✅ Target detected!";
});

target.addEventListener("targetLost", () => {
    console.log("TARGET LOST!");

    status.innerText = "🔍 Looking for target...";
});