const videoElement = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const plotContainer = document.getElementById("plotContainer");
const filteredImage = document.getElementById("filteredImage");

let mediaRecorder;
let chunks = [];

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });

  videoElement.srcObject = stream;

  const [track] = stream.getVideoTracks();
  const capabilities = track.getCapabilities();
  if (capabilities.torch) {
    track.applyConstraints({ advanced: [{ torch: true }] });
  }

  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => chunks.push(event.data);

  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: "video/mp4" });
    chunks = [];

    const formData = new FormData();
    formData.append("video", blob, "video.mp4");

    // Send video to Python backend
    const response = await fetch("http://localhost:8000/process", {
      method: "POST",
      body: formData,
    });

    const data = await response.blob();
    const imageUrl = URL.createObjectURL(data);
    filteredImage.src = imageUrl;
    plotContainer.classList.remove("hidden");

    // Optional download
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "filtered_plot.png";
    a.click();
  };

  startBtn.addEventListener("click", () => {
    mediaRecorder.start();
    startBtn.classList.add("hidden");
    stopBtn.classList.remove("hidden");

    setTimeout(() => {
      mediaRecorder.stop();
      stopBtn.classList.add("hidden");
      startBtn.classList.remove("hidden");
    }, 15000); // auto-stop
  });

  stopBtn.addEventListener("click", () => {
    mediaRecorder.stop();
    stopBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
  });
}

startCamera();
