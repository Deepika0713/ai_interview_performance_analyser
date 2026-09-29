# 🎯 AI Interview Performance Analyzer (Phases 1, 2 & 3)

A modular, production-grade multimodal ML web application engineered for automated candidate interview performance evaluation. Built with **Streamlit**, **Streamlit-WebRTC**, **Librosa**, **Pydub**, **MediaPipe**, **DeepFace**, **Qwen2-Audio (Hugging Face)**, and **Plotly**.

---

## 🌟 Architecture & Capabilities

### Phase 1: Media Capture & Temporary Infrastructure
- **Modern Wide Layout & Dark UI**: Streamlit components styled for high contrast.
- **Dynamic Configuration Sidebar**: Target Job Role selection (`Software Engineer`, `Product Manager`, `HR Specialist / People Ops`) and question presets.
- **Two Media Input Tabs**:
  - **File Upload Tab**: Format validation for **WAV**, **MP3**, and **MP4** with a 50 MB threshold.
  - **Live Recording Tab**: Synchronized browser webcam & microphone capture via `streamlit-webrtc`.
- **Local Temporary Storage (`./temp`)**: Collision-free UUID caching and automatic cleanup.

### Phase 2: Computer Vision & Demeanor Tracking (`vision_processor.py`)
- **MediaPipe 3D Landmark & Gaze Tracking**:
  - Uses MediaPipe 468 3D landmarks + iris center mesh (indices 468 & 473).
  - Estimates **Head Pose (Pitch, Yaw, Roll)** using Perspective-n-Point (`cv2.solvePnP`).
  - Evaluates **Eye Contact Score (%)** and Gaze Direction Status.
  - Detects **Movement Stability & Fidgeting** (excessive nodding, tilting).
- **Facial Emotion Recognition via DeepFace**:
  - Sub-samples video frames at **1 FPS** (1 frame per second) for rapid ML throughput without freezing the UI.
  - Quantifies emotional breakdown: **Neutral**, **Happy**, **Nervous/Fearful**, **Sad**, and **Surprised**.
- **Interactive Plotly Visualizations**:
  - Donut Chart for facial emotion breakdown.
  - Timeline Line Chart for moment-by-moment gaze engagement against an 80% benchmark.

### Phase 3: Speech & Audio Intelligence (`audio_processor.py`)
- **Physical Audio Metrics via Librosa & Pydub**:
  - Extracts sample rate, audio duration, active speech duration, and RMS energy.
  - **Words Per Minute (WPM)**: Syllabic onset calculation with target 130–160 WPM cadence evaluation.
  - **Pause & Silence Analysis**: Detects silence intervals > 1.5 seconds and tracks long pause counts and total silence ratio (%).
- **Multimodal Speech Analysis via Qwen2-Audio (`Qwen/Qwen2-Audio-7B-Instruct`)**:
  - Connects to Hugging Face Inference API with a strict system prompt.
  - Generates:
    - Verbatim speech transcript.
    - Relevance Score (0–100), Keyword Coverage (0–100), Structural Clarity (0–100), Tone Confidence (0–100).
    - Detected filler words (`"um"`, `"like"`, `"you know"`) and filler frequency count.
    - Actionable Candidate Strengths and Improvement Areas.
  - Resilient error handling and calibrated fallback when `HF_TOKEN` is unset or endpoints are loading.

---

## 🚀 Quickstart: Running Locally

### Step 1: Clone or Open Project
```bash
cd ai-interview-performance-analyzer
```

### Step 2: Set Up Virtual Environment
Python 3.10 or 3.11 is recommended:
```bash
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

*(Note for Linux/Debian: If OpenCV or FFmpeg is required: `sudo apt-get install -y ffmpeg libgl1-mesa-glx libglib2.0-0`)*

### Step 4: (Optional) Set Hugging Face Token for Live Qwen2-Audio Endpoint
```bash
export HF_TOKEN="your_huggingface_token_here"
```
*(If omitted, the audio processor runs the built-in offline heuristic fallback preserving full schema compliance).*

### Step 5: Run the Streamlit Application
```bash
streamlit run app.py
```
Open `http://localhost:8501` in your browser.

---

## 📁 Project Structure

```
├── app.py                      # Main Streamlit web application entry point
├── audio_processor.py          # Dedicated Phase 3 Speech & Audio ML Processor
├── vision_processor.py         # Dedicated Phase 2 Vision & Emotion Processor
├── requirements.txt            # Python dependencies (MediaPipe, DeepFace, Librosa, HuggingFace)
├── README.md                   # Setup guide and technical architecture
├── temp/                       # Local temporary media storage (auto-provisioned)
└── utils/
    ├── __init__.py             # Package initializer
    ├── audio_processor.py      # Module alias for package imports
    ├── media_processor.py      # Storage, validation, and audio/video feature extraction
    ├── pipeline_stubs.py       # Speech & acoustic feature extraction stubs
    └── vision_processor.py     # Module alias for package imports
```
