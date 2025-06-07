from flask import Flask, Response, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import requests
import subprocess
import os
import shutil

app = Flask(__name__)
CORS(app)

model = YOLO('yolov8n.pt')

ESP32_STREAM_URL = 'http://192.168.100.65:81/stream'
ESP32_AUDIO_URL = 'http://192.168.100.65:81/audio_feed'

HLS_DIR = 'static/hls'
if os.path.exists(HLS_DIR):
    shutil.rmtree(HLS_DIR)
os.makedirs(HLS_DIR, exist_ok=True)

def get_mjpeg_stream():
    try:
        stream = requests.get(ESP32_STREAM_URL, stream=True, timeout=5)
        bytes_data = bytes()
        for chunk in stream.iter_content(chunk_size=1024):
            bytes_data += chunk
            a = bytes_data.find(b'\xff\xd8')
            b = bytes_data.find(b'\xff\xd9')
            if a != -1 and b != -1:
                jpg = bytes_data[a:b+2]
                bytes_data = bytes_data[b+2:]
                frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                if frame is not None:
                    yield frame
    except Exception as e:
        print(f"Lỗi kết nối đến ESP32-S3 (video): {e}")
        yield None

def generate_frames():
    for frame in get_mjpeg_stream():
        if frame is None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + b'\r\n')
            continue
        results = model(frame, conf=0.5, iou=0.7)
        detections = results[0].boxes
        for box in detections:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            label = f"{model.names[cls]} {conf:.2f}"
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/yolo', methods=['POST','GET'])
def yolo():
    print("Gửi phản hồi từ /yolo: person (0.95)")
    return jsonify({"message": "person (0.95)"})

def generate_audio():
    try:
        audio_url = ESP32_AUDIO_URL
        stream = requests.get(audio_url, stream=True, timeout=5)
        for chunk in stream.iter_content(chunk_size=1024):
            yield chunk
    except Exception as e:
        print(f"Lỗi stream âm thanh từ ESP32-S3: {e}")
        yield b''

@app.route('/audio_feed')
def audio_feed():
    return Response(generate_audio(), mimetype='audio/wav')

def start_ffmpeg_stream():
    output_path = os.path.join(HLS_DIR, 'stream.m3u8')
    ffmpeg_cmd = [
        'ffmpeg',
        '-i', 'http://localhost:5000/video_feed',
        '-i', 'http://localhost:5000/audio_feed',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-f', 'hls',
        '-hls_time', '2',
        '-hls_list_size', '3',
        '-hls_flags', 'delete_segments',
        output_path
    ]
    try:
        process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate(timeout=10)
        if process.returncode != 0:
            print(f"Lỗi FFmpeg: {stderr.decode()}")
    except subprocess.TimeoutExpired:
        print("FFmpeg khởi động nhưng không phản hồi, có thể do luồng không khả dụng.")
    except Exception as e:
        print(f"Lỗi khởi động FFmpeg: {e}")

@app.route("/hls/<path:filename>")
def serve_hls(filename):
    file_path = os.path.join(HLS_DIR, filename)
    if os.path.exists(file_path):
        return send_file(file_path)
    else:
        return jsonify({"error": "File HLS không tồn tại"}), 404

start_ffmpeg_stream()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
