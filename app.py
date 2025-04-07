from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from moviepy.video.io.VideoFileClip import VideoFileClip
import matplotlib.pyplot as plt
import numpy as np
import cv2
import os
import time
import pandas as pd
import scipy.signal

app = FastAPI()

@app.post("/process")
async def process_video(video: UploadFile = File(...)):
    # Save uploaded video
    with open("uploaded.mp4", "wb") as f:
        f.write(await video.read())

    # Crop video
    video_clip = VideoFileClip("uploaded.mp4").subclip(3)
    video_clip.write_videofile("cropped.mp4", codec="libx264")

    # Extract frames
    cap = cv2.VideoCapture("cropped.mp4")
    fps = 30
    count = 0
    r_vals = []

    while cap.isOpened() and count < 300:
        ret, frame = cap.read()
        if not ret:
            break
        avg_r = np.mean(frame[:, :, 2])
        r_vals.append(avg_r)
        count += 1
    cap.release()

    # Bandpass filter
    def bandpass(signal):
        order = 6
        fs = 30
        low = 60 / 60
        high = 220 / 60
        b, a = scipy.signal.butter(order, [low * 2 / fs, high * 2 / fs], btype="band")
        return scipy.signal.filtfilt(b, a, signal)

    r_array = np.array(r_vals)[::-1]
    filtered = bandpass(r_array)

    # Plot
    plt.figure(figsize=(8, 4))
    time_axis = np.linspace(0, 10, len(filtered))
    plt.plot(time_axis, filtered, c='red')
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")
    plt.title("Filtered Signal")
    plt.tight_layout()
    output_path = "filtered_plot.png"
    plt.savefig(output_path)
    plt.close()

    return FileResponse(output_path, media_type="image/png")
