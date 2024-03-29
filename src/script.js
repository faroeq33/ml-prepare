import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const demosSection = document.getElementById("demos");
let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: runningMode,
    numHands: 2,
  });
  demosSection.classList.remove("invisible");
};
createHandLandmarker();

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
// Check if webcam access is supported.
const hasGetUserMedia = () => {
  var _a;
  return !!((_a = navigator.mediaDevices) === null || _a === void 0
    ? void 0
    : _a.getUserMedia);
};
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam() {
  if (!handLandmarker) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }
  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }
  // getUsermedia parameters.
  const constraints = {
    video: true,
  };
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
// console.log(video);
async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await handLandmarker.setOptions({ runningMode: "VIDEO" });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 1 });
    }
  }
  canvasCtx.restore();
  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

let myPoses = [];

document.getElementById("captureHandPose").addEventListener("click", (e) => {
  onCapturePose(e);
});

function onCapturePose() {
  if (!results) {
    const message =
      "The 'results' global variable is not set yet. Turn on your webcam to detect your hand pose and click the button again.";
    console.warn(message);

    // write the message to the page
    document.getElementById("errors").innerHTML = message;
    return;
  }

  const labeledPose = {
    vector: convertPoseToVector(results.landmarks[0]),
    label: "mute",
  };

  myPoses.push(labeledPose);

  // notify user
  saveCount();
  // console.log(myPoses);
}

function convertPoseToVector(pose) {
  return pose
    .map((point) => {
      return [point.x, point.y, point.z];
    })
    .flat();
}

// make new button to save the poses
document
  .getElementById("savePosesButton")
  .addEventListener("click", onSavePoses);

function onSavePoses() {
  // console.log(datetime);

  // Choose a stragagy to save the poses, could be file, localstorage, or database
  savePosesToFile();

  // localStorage.setItem(`myPoses-${datetime}`, JSON.stringify(myPoses));

  console.log("Poses saved to file");
}

function saveCount() {
  if (myPoses.length === 0) {
    console.warn("'myPoses' is empty. Please capture a pose first.");
  }
  console.log("saveCount");
  document.getElementById("saveCount").innerHTML =
    myPoses.length + " poses saved";
}

const showPosesButton = document.getElementById("showPoses");
showPosesButton.addEventListener("click", showData);

function showData() {
  console.log("showData");
  // console.log(myPoses);

  document.getElementById("poseOutput").innerHTML = JSON.stringify(myPoses);
}

function savePosesToFile() {
  // localStorage.setItem(`myPoses-${datetime}`, JSON.stringify(myPoses));
  const currentdate = new Date();

  const datetime =
    currentdate.getDate() +
    "-" +
    (currentdate.getMonth() + 1) +
    "-" +
    currentdate.getFullYear() +
    "@" +
    currentdate.getHours() +
    "h" +
    currentdate.getMinutes() +
    "m" +
    currentdate.getSeconds() +
    "s";

  const finalPoses = JSON.stringify({ data: myPoses }, null, 2);
  const blob = new Blob([finalPoses], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `poses-${datetime}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
