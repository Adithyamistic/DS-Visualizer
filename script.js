/* =================================================*
*   DATA
*================================================= */

let mode = null;
let stack = [];
let queue = [];

const MAX_SIZE = 6;


/* =================================================*
*   DOM
*================================================= */

const stackVisual =
    document.getElementById("stackVisual");

const queueVisual =
    document.getElementById("queueVisual");

const startScreen =
    document.getElementById("startScreen");

const stackContainer =
    document.getElementById("stackContainer");

const queueContainer =
    document.getElementById("queueContainer");

const info =
    document.getElementById("info");

const dataStatus =
    document.getElementById("dataStatus");

const modeLabel =
    document.getElementById("modeLabel");

const operations =
    document.getElementById("operations");

const stackButtons =
    document.getElementById("stackButtons");

const queueButtons =
    document.getElementById("queueButtons");

const arTitle =
    document.getElementById("arTitle");

const arSubtitle =
    document.getElementById("arSubtitle");

const arInfo =
    document.getElementById("arInfo");

const stackTopIndicator =
    document.getElementById("stackTopIndicator");

const queueFrontIndicator =
    document.getElementById("queueFrontIndicator");

const queueFrontPointer =
    document.getElementById("queueFrontPointer");

const queueRearPointer =
    document.getElementById("queueRearPointer");

const arrayInfo =
    document.getElementById("arrayInfo");

const warning =
    document.getElementById("warning");

const pseudocodePanel =
    document.getElementById("pseudocodePanel");

const stackPseudo =
    document.getElementById("stackPseudo");

const queuePseudo =
    document.getElementById("queuePseudo");


/* =================================================*
*   MARKER TRACKING
*================================================= */

const marker =
    document.getElementById("hiroMarker");

const status =
    document.getElementById("status");


marker.addEventListener(
    "markerFound",
    function () {

        console.log("Hiro marker detected");

        status.innerText =
            "✅ AR marker detected";
    }
);


marker.addEventListener(
    "markerLost",
    function () {

        console.log("Hiro marker lost");

        status.innerText =
            "🔍 Looking for Hiro marker...";
    }
);


/* =================================================*
*   CHOOSE STACK / QUEUE
*================================================= */

function chooseMode(selectedMode) {

    mode = selectedMode;

    startScreen.setAttribute(
        "visible",
        "false"
    );

    operations.style.display =
        "block";

    modeLabel.style.display =
        "block";

    hideWarning();
    hidePseudocode();

    if (mode === "stack") {

        modeLabel.innerText =
            "📚 STACK — LIFO";

        modeLabel.style.color =
            "#45b6ff";

        modeLabel.style.background =
            "rgba(69,182,255,0.15)";


        stackVisual.setAttribute(
            "visible",
            "true"
        );

        queueVisual.setAttribute(
            "visible",
            "false"
        );


        stackButtons.style.display =
            "grid";

        queueButtons.style.display =
            "none";


        arTitle.setAttribute(
            "value",
            "STACK"
        );

        arSubtitle.setAttribute(
            "value",
            "LIFO - LAST IN, FIRST OUT"
        );

        arInfo.setAttribute(
            "value",
            "STACK\nLIFO"
        );


        info.innerText =
            "STACK selected.\n\n" +
            "Enter a value and press PUSH.";

        updateStatus();

        updatePseudocodeMode();

    }

    else {

        modeLabel.innerText =
            "🚶 QUEUE — FIFO";

        modeLabel.style.color =
            "#45d6a0";

        modeLabel.style.background =
            "rgba(69,214,160,0.15)";


        stackVisual.setAttribute(
            "visible",
            "false"
        );

        queueVisual.setAttribute(
            "visible",
            "true"
        );


        stackButtons.style.display =
            "none";

        queueButtons.style.display =
            "grid";


        arTitle.setAttribute(
            "value",
            "QUEUE"
        );

        arSubtitle.setAttribute(
            "value",
            "FIFO - FIRST IN, FIRST OUT"
        );

        arInfo.setAttribute(
            "value",
            "QUEUE\nFIFO"
        );


        info.innerText =
            "QUEUE selected.\n\n" +
            "Enter a value and press ENQUEUE.";

        updateStatus();

        updatePseudocodeMode();
    }
}


/* =================================================*
*   CREATE STACK BLOCK
*================================================= */

function createStackBlock(value, index) {

    const block =
        document.createElement("a-entity");


    block.setAttribute(
        "position",
        `0 ${index * 0.32} 0`
    );


    const box =
        document.createElement("a-box");


    box.setAttribute(
        "width",
        "1.15"
    );

    box.setAttribute(
        "height",
        "0.27"
    );

    box.setAttribute(
        "depth",
        "0.80"
    );


    box.setAttribute(
        "color",
        getColor(index)
    );


    block.appendChild(box);


    const text =
        document.createElement("a-text");


    text.setAttribute(
        "value",
        String(value)
    );

    text.setAttribute(
        "position",
        "0 0.01 0.41"
    );

    text.setAttribute(
        "align",
        "center"
    );

    text.setAttribute(
        "color",
        "white"
    );

    text.setAttribute(
        "width",
        "2.2"
    );


    block.appendChild(text);


    stackContainer.appendChild(
        block
    );
}


/* =================================================*
*   CREATE QUEUE BLOCK
*================================================= */

function createQueueBlock(value, index) {

    const block =
        document.createElement("a-entity");


    const x =
        -1.20 + index * 0.48;


    block.setAttribute(
        "position",
        `${x} 0.18 0`
    );


    const box =
        document.createElement("a-box");


    box.setAttribute(
        "width",
        "0.42"
    );

    box.setAttribute(
        "height",
        "0.42"
    );

    box.setAttribute(
        "depth",
        "0.70"
    );


    box.setAttribute(
        "color",
        getQueueColor(index)
    );


    block.appendChild(box);


    const text =
        document.createElement("a-text");


    text.setAttribute(
        "value",
        String(value)
    );

    text.setAttribute(
        "position",
        "0 0 0.36"
    );

    text.setAttribute(
        "align",
        "center"
    );

    text.setAttribute(
        "color",
        "white"
    );

    text.setAttribute(
        "width",
        "1.2"
    );


    block.appendChild(text);


    queueContainer.appendChild(
        block
    );
}


/* =================================================*
*   COLORS
*================================================= */

function getColor(index) {

    const colors = [
        "#2980b9",
        "#3498db",
        "#1abc9c",
        "#9b59b6",
        "#e67e22",
        "#e74c3c"
    ];

    return colors[
        index % colors.length
    ];
}


function getQueueColor(index) {

    const colors = [
        "#16a085",
        "#27ae60",
        "#2ecc71",
        "#f1c40f",
        "#e67e22",
        "#e74c3c"
    ];

    return colors[
        index % colors.length
    ];
}


/* =================================================*
*   RENDER STACK
*================================================= */

function renderStack() {

    while (
        stackContainer.firstChild
    ) {

        stackContainer.removeChild(
            stackContainer.firstChild
        );
    }


    stack.forEach(
        function (value, index) {

            createStackBlock(
                value,
                index
            );
        }
    );


    updateStackPointer();

    updateStatus();
}


/* =================================================*
*   RENDER QUEUE
*================================================= */

function renderQueue() {

    while (
        queueContainer.firstChild
    ) {

        queueContainer.removeChild(
            queueContainer.firstChild
        );
    }


    queue.forEach(
        function (value, index) {

            createQueueBlock(
                value,
                index
            );
        }
    );


    updateQueuePointers();

    updateStatus();
}


/* =================================================*
*   STACK TOP POINTER
*================================================= */

function updateStackPointer() {

    if (!stackTopIndicator) {
        return;
    }


    if (stack.length === 0) {

        stackTopIndicator.setAttribute(
            "visible",
            "false"
        );

        return;
    }


    const topIndex =
        stack.length - 1;


    const y =
        topIndex * 0.32 + 0.22;


    stackTopIndicator.setAttribute(
        "position",
        `0 ${y} 0.50`
    );


    stackTopIndicator.setAttribute(
        "visible",
        "true"
    );
}


/* =================================================*
*   QUEUE FRONT + REAR POINTERS
*================================================= */

function updateQueuePointers() {

    if (
        !queueFrontPointer ||
        !queueRearPointer
    ) {
        return;
    }


    if (queue.length === 0) {

        queueFrontPointer.setAttribute(
            "visible",
            "false"
        );

        queueRearPointer.setAttribute(
            "visible",
            "false"
        );

        return;
    }


    const frontX =
        -1.20;

    const rearX =
        -1.20 +
        (queue.length - 1) * 0.48;


    queueFrontPointer.setAttribute(
        "position",
        `${frontX} 0.72 0.05`
    );


    queueRearPointer.setAttribute(
        "position",
        `${rearX} 0.72 0.05`
    );


    queueFrontPointer.setAttribute(
        "visible",
        "true"
    );

    queueRearPointer.setAttribute(
        "visible",
        "true"
    );


    if (queueFrontIndicator) {

        queueFrontIndicator.setAttribute(
            "position",
            `${frontX} 0.65 0.05`
        );

        queueFrontIndicator.setAttribute(
            "visible",
            "true"
        );
    }
}


/* =================================================*
*   UPDATE STATUS
*================================================= */

function updateStatus() {

    if (!arrayInfo || !dataStatus) {
        return;
    }


    if (mode === "stack") {

        arrayInfo.innerText =
            "Array Size: " +
            MAX_SIZE +
            " | Used: " +
            stack.length +
            " / " +
            MAX_SIZE;


        dataStatus.innerText =
            "Stack: [" +
            stack.join(", ") +
            "]";
    }


    else if (mode === "queue") {

        arrayInfo.innerText =
            "Array Size: " +
            MAX_SIZE +
            " | Used: " +
            queue.length +
            " / " +
            MAX_SIZE;


        dataStatus.innerText =
            "Queue: [" +
            queue.join(", ") +
            "]";
    }
}


/* =================================================*
*   WARNING
*================================================= */

function showWarning(message) {

    if (!warning) {
        return;
    }


    warning.innerText =
        message;

    warning.style.display =
        "block";
}


function hideWarning() {

    if (!warning) {
        return;
    }


    warning.style.display =
        "none";
}


/* =================================================*
*   PUSH
*================================================= */

function pushValue() {

    if (mode !== "stack") {
        return;
    }


    const input =
        document.getElementById(
            "valueInput"
        );


    const value =
        input.value.trim();


    if (value === "") {

        info.innerText =
            "Please enter a value.";

        return;
    }


    if (stack.length >= MAX_SIZE) {

        showWarning(
            "⚠️ STACK OVERFLOW — Array is full!"
        );

        info.innerText =
            "Cannot PUSH. Stack is full.";

        return;
    }


    hideWarning();


    stack.push(value);


    renderStack();


    info.innerText =
        "PUSH successful.\n\n" +
        value +
        " added to the TOP of the Stack.";

}


/* =================================================*
*   POP
*================================================= */

function popValue() {

    if (mode !== "stack") {
        return;
    }


    if (stack.length === 0) {

        showWarning(
            "⚠️ STACK UNDERFLOW — Stack is empty!"
        );

        info.innerText =
            "Cannot POP. Stack is empty.";

        return;
    }


    hideWarning();


    const value =
        stack.pop();


    renderStack();


    info.innerText =
        "POP successful.\n\n" +
        value +
        " removed from the TOP.";
}


/* =================================================*
*   PEEK
*================================================= */

function peekValue() {

    if (mode !== "stack") {
        return;
    }


    if (stack.length === 0) {

        showWarning(
            "⚠️ STACK UNDERFLOW — Stack is empty!"
        );

        info.innerText =
            "Cannot PEEK. Stack is empty.";

        return;
    }


    hideWarning();


    const value =
        stack[
            stack.length - 1
        ];


    info.innerText =
        "PEEK\n\n" +
        "TOP value = " +
        value;

    updateStackPointer();
}


/* =================================================*
*   ENQUEUE
*================================================= */

function enqueueValue() {

    if (mode !== "queue") {
        return;
    }


    const input =
        document.getElementById(
            "valueInput"
        );


    const value =
        input.value.trim();


    if (value === "") {

        info.innerText =
            "Please enter a value.";

        return;
    }


    if (queue.length >= MAX_SIZE) {

        showWarning(
            "⚠️ QUEUE OVERFLOW — Array is full!"
        );

        info.innerText =
            "Cannot ENQUEUE. Queue is full.";

        return;
    }


    hideWarning();


    queue.push(value);


    renderQueue();


    info.innerText =
        "ENQUEUE successful.\n\n" +
        value +
        " added at the REAR of the Queue.";
}


/* =================================================*
*   DEQUEUE
*================================================= */

function dequeueValue() {

    if (mode !== "queue") {
        return;
    }


    if (queue.length === 0) {

        showWarning(
            "⚠️ QUEUE UNDERFLOW — Queue is empty!"
        );

        info.innerText =
            "Cannot DEQUEUE. Queue is empty.";

        return;
    }


    hideWarning();


    const value =
        queue.shift();


    renderQueue();


    info.innerText =
        "DEQUEUE successful.\n\n" +
        value +
        " removed from the FRONT.";
}


/* =================================================*
*   FRONT
*================================================= */

function frontValue() {

    if (mode !== "queue") {
        return;
    }


    if (queue.length === 0) {

        showWarning(
            "⚠️ QUEUE UNDERFLOW — Queue is empty!"
        );

        info.innerText =
            "Cannot check FRONT. Queue is empty.";

        return;
    }


    hideWarning();


    const value =
        queue[0];


    info.innerText =
        "FRONT\n\n" +
        "Front value = " +
        value;


    updateQueuePointers();
}


/* =================================================*
*   RESET
*================================================= */

function resetData() {

    stack = [];
    queue = [];


    hideWarning();
    hidePseudocode();


    if (mode === "stack") {

        renderStack();

        info.innerText =
            "Stack reset.\n\n" +
            "Enter a value and press PUSH.";
    }


    else if (mode === "queue") {

        renderQueue();

        info.innerText =
            "Queue reset.\n\n" +
            "Enter a value and press ENQUEUE.";
    }


    updateStatus();
}


/* =================================================*
*   PSEUDOCODE
*================================================= */

/* =================================================*
   PSEUDOCODE TOGGLE
================================================= */

function updatePseudocodeMode() {
    const stackCode = document.getElementById("stackPseudo");
    const queueCode = document.getElementById("queuePseudo");

    if (!stackCode || !queueCode) return;

    stackCode.style.display = mode === "stack" ? "block" : "none";
    queueCode.style.display = mode === "queue" ? "block" : "none";
}

function togglePseudocode() {
    const panel = document.getElementById("pseudocodePanel");

    if (!panel) {
        console.error("Pseudocode panel not found in HTML!");
        return;
    }

    const isHidden = getComputedStyle(panel).display === "none";

    if (isHidden) {
        updatePseudocodeMode();
        panel.style.display = "block";
    } else {
        panel.style.display = "none";
    }
}

function showPseudocode() {
    const panel = document.getElementById("pseudocodePanel");

    if (!panel) return;

    updatePseudocodeMode();
    panel.style.display = "block";
}

function hidePseudocode() {
    const panel = document.getElementById("pseudocodePanel");

    if (panel) {
        panel.style.display = "none";
    }
}

/* =================================================*
*   BACK TO SELECTION
*================================================= */

function backToSelection() {

    mode = null;

    stack = [];
    queue = [];


    operations.style.display =
        "none";

    modeLabel.style.display =
        "none";


    stackVisual.setAttribute(
        "visible",
        "false"
    );

    queueVisual.setAttribute(
        "visible",
        "false"
    );


    startScreen.setAttribute(
        "visible",
        "true"
    );


    hideWarning();
    hidePseudocode();


    updateStatus();
}


/* =================================================*
*   ENTER KEY
*================================================= */

const valueInput =
    document.getElementById(
        "valueInput"
    );


if (valueInput) {

    valueInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Enter") {
                return;
            }


            if (mode === "stack") {

                pushValue();
            }


            else if (mode === "queue") {

                enqueueValue();
            }
        }
    );
}


/* =================================================*
*   INITIAL STATE
*================================================= */

hideWarning();
hidePseudocode();

if (stackTopIndicator) {

    stackTopIndicator.setAttribute(
        "visible",
        "false"
    );
}


if (queueFrontPointer) {

    queueFrontPointer.setAttribute(
        "visible",
        "false"
    );
}


if (queueRearPointer) {

    queueRearPointer.setAttribute(
        "visible",
        "false"
    );
}