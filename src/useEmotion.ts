import * as faceapi from "face-api.js";

class Emotion {
  private videoEL: HTMLVideoElement;
  private containerEL: HTMLDivElement;
  private canvas: HTMLCanvasElement | null;
  private callback: Function | null;
  private intervalRef: any;

  constructor(callback: Function | null = null) {
    const vidEL = document.getElementById("video");
    if (!vidEL) throw new Error("No video element found");
    this.videoEL = vidEL as HTMLVideoElement;
    const contEL = document.getElementById("app-container");
    if (!contEL) throw new Error("No container element found");
    this.containerEL = contEL as HTMLDivElement;
    this.callback = callback;
    this.canvas = null;
  }

  private async loadModel() {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        // faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      ]);
    } catch (error) {
      alert("Error loading models" + error);
    }
  }

  private async startWebCam() {
    try {
      const options = {
        audio: false, // audio is not included in the video
        video: { 
          facingMode: "user", // Request the user-facing camera on devices with multiple camera options
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(options);
      this.videoEL.srcObject = stream;
      return true;
    } catch (error) {
      alert(error);
      return false;
    }
  }

  async start() {
    await this.loadModel();
    await this.startWebCam();
    this.videoEL.addEventListener("play", this.onVideoPlay.bind(this));
  }

  async stop() {
    this.videoEL.removeEventListener("play", this.onVideoPlay.bind(this));
    clearInterval(this.intervalRef);
    this.canvas?.remove();
    this.canvas = null;
  }

  private onVideoPlay() {
    if (!this.canvas) this.canvas = faceapi.createCanvasFromMedia(this.videoEL);

    const canvas = this.canvas;

    this.containerEL.append(canvas);
    faceapi.matchDimensions(canvas, this.getVideoDimensions());
    this.intervalRef = setInterval(() => {
      this.startDetection(canvas);
    }, 200);

    this.startDetection(canvas);
  }

  private async startDetection(canvas: HTMLCanvasElement) {
    const detections = await faceapi.detectSingleFace(this.videoEL, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
    if (!detections || !canvas) return;

    const dims = this.getVideoDimensions();

    const resizedDetections = faceapi.resizeResults(detections, dims);
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);

    const box = resizedDetections.detection.box;

    const max = this.getMax(resizedDetections.expressions);
    const emotion = EMOTIONS.find((e) => e.key === max.key);
    if (!emotion) return;

    const drawLabelOptions = {
      backgroundColor: emotion.color,
      fontColor: emotion.fontColor,
      padding: 10,
    };

    const drawBox = new faceapi.draw.DrawBox(box, { label: emotion.label, boxColor: emotion.color, lineWidth: 5, drawLabelOptions });

    drawBox.draw(canvas);
    if (typeof this.callback === "function") this.callback(detections, emotion);
  }

  private getMax(obj: any) {
    let max = 0;
    let maxKey = "";

    for (const key of Object.keys(obj)) {
      if (obj[key] < max) continue;
      max = obj[key];
      maxKey = key;
    }

    return { key: maxKey, value: max };
  }

  private getVideoDimensions() {
    const video = this.videoEL;
    return { width: video.clientWidth, height: video.clientHeight };
  }
}

export default function useEmotion(callback: Function | null = null) {
  const emotion = new Emotion(callback);
  return emotion;
}

export const EMOTIONS = [
  {
    key: "angry",
    label: "Angry",
    color: "red",
    fontColor: "white",
    emoji: "😡",
  },
  {
    key: "disgusted",
    label: "Disgusted",
    color: "green",
    fontColor: "white",
    emoji: "🤢",
  },
  {
    key: "fearful",
    label: "Fear",
    color: "purple",
    fontColor: "white",
    emoji: "😱",
  },
  {
    key: "happy",
    label: "Happy",
    color: "Yellow",
    fontColor: "black",
    emoji: "😄",
  },
  {
    key: "neutral",
    label: "Neutral",
    color: "gray",
    fontColor: "white",
    emoji: "😐",
  },
  {
    key: "sad",
    label: "Sad",
    color: "red",
    fontColor: "white",
    emoji: "😢",
  },
  {
    key: "surprised",
    label: "Surprised",
    color: "orange",
    fontColor: "black",
    emoji: "😲",
  },
] as const;
