// This demo is cut out of the main file, it is dependant on handlandmarker and more
// CSS class 'detectionOnClick'. Lets get all the elements that have
// this class.
const imageContainers = document.getElementsByClassName("detectOnClick");
// Now let's go through all of these and add a click event listener.
for (let i = 0; i < imageContainers.length; i++) {
  // Add event listener to the child element whichis the img element.
  imageContainers[i].children[0].addEventListener("click", handleClick);
}
// When an image is clicked, let's detect it and display results!
async function handleClick(event) {
  if (!handLandmarker) {
    console.log("Wait for handLandmarker to load before clicking!");
    return;
  }
  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await handLandmarker.setOptions({ runningMode: "IMAGE" });
  }
  // Remove all landmarks drawed before
  const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
  for (var i = allCanvas.length - 1; i >= 0; i--) {
    const n = allCanvas[i];
    n.parentNode.removeChild(n);
  }
  // We can call handLandmarker.detect as many times as we like with
  // different image data each time. This returns a promise
  // which we wait to complete and then call a function to
  // print out the results of the prediction.
  const handLandmarkerResult = handLandmarker.detect(event.target);
  console.log(handLandmarkerResult.handednesses[0][0]);
  const canvas = document.createElement("canvas");
  canvas.setAttribute("class", "canvas");
  canvas.setAttribute("width", event.target.naturalWidth + "px");
  canvas.setAttribute("height", event.target.naturalHeight + "px");
  canvas.style =
    "left: 0px;" +
    "top: 0px;" +
    "width: " +
    event.target.width +
    "px;" +
    "height: " +
    event.target.height +
    "px;";
  event.target.parentNode.appendChild(canvas);
  const cxt = canvas.getContext("2d");
  for (const landmarks of handLandmarkerResult.landmarks) {
    drawConnectors(cxt, landmarks, HAND_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 5,
    });
    drawLandmarks(cxt, landmarks, { color: "#FF0000", lineWidth: 1 });
  }
}
