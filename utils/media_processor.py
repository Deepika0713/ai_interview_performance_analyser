"""
Media Processing Infrastructure for AI Interview Performance Analyzer.
Handles temporary storage, validation, audio inspection with librosa/pydub, and video metadata.
"""

import os
import time
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

# Define default paths
TEMP_DIR = Path("./temp")
MAX_UPLOAD_SIZE_MB = 50.0  # 50 MB threshold for file validation


def ensure_temp_dir(directory: Path = TEMP_DIR) -> Path:
    """
    Ensure the temporary working directory exists.
    """
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def cleanup_temp_files(max_age_seconds: int = 3600, directory: Path = TEMP_DIR) -> int:
    """
    Clean up files older than max_age_seconds in the temporary directory.
    Returns the count of deleted files.
    """
    if not directory.exists():
        return 0

    removed = 0
    now = time.time()
    for item in directory.glob("*"):
        if item.is_file():
            try:
                if now - item.stat().st_mtime > max_age_seconds:
                    item.unlink()
                    removed += 1
            except Exception:
                pass
    return removed


def validate_file(uploaded_file, allowed_extensions: Tuple[str, ...], max_size_mb: float = MAX_UPLOAD_SIZE_MB) -> Tuple[bool, str]:
    """
    Validates the uploaded file extension and byte size.
    Returns (is_valid, error_message).
    """
    if uploaded_file is None:
        return False, "No file provided."

    file_name = uploaded_file.name
    file_ext = Path(file_name).suffix.lower()

    if file_ext not in allowed_extensions:
        return False, f"Unsupported format '{file_ext}'. Allowed formats: {', '.join(allowed_extensions)}"

    file_size_mb = uploaded_file.size / (1024 * 1024)
    if file_size_mb > max_size_mb:
        return False, f"File size ({file_size_mb:.1f} MB) exceeds maximum allowed size of {max_size_mb:.0f} MB."

    return True, ""


def save_uploaded_file(uploaded_file, directory: Path = TEMP_DIR) -> Tuple[str, str]:
    """
    Saves an uploaded Streamlit file buffer into the temporary directory with a collision-free UUID.
    Returns (saved_path, unique_file_id).
    """
    ensure_temp_dir(directory)
    file_ext = Path(uploaded_file.name).suffix.lower()
    unique_id = str(uuid.uuid4())[:8]
    clean_name = f"interview_{unique_id}_{int(time.time())}{file_ext}"
    dest_path = directory / clean_name

    with open(dest_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

    return str(dest_path), unique_id


def get_audio_metadata(file_path: str) -> Dict[str, Any]:
    """
    Extracts audio duration, sample rate, channels, and basic RMS energy metrics.
    Gracefully uses librosa or pydub if installed, with basic fallback.
    """
    metadata: Dict[str, Any] = {
        "file_name": os.path.basename(file_path),
        "file_size_mb": round(os.path.getsize(file_path) / (1024 * 1024), 2),
        "format": Path(file_path).suffix.lower().replace(".", ""),
        "duration_sec": 0.0,
        "sample_rate": 0,
        "channels": 1,
        "energy_level": "Normal",
    }

    # Attempt inspection via librosa
    try:
        import librosa
        # Load audio duration without reading entire waveform to preserve memory
        duration = librosa.get_duration(path=file_path)
        metadata["duration_sec"] = round(float(duration), 2)
        
        # Fast sampling for rate and RMS estimation
        y, sr = librosa.load(file_path, sr=None, duration=min(30.0, duration or 1.0))
        metadata["sample_rate"] = int(sr)
        rms = float(librosa.feature.rms(y=y).mean())
        metadata["rms_energy"] = round(rms, 4)
        metadata["energy_level"] = "Optimal" if rms > 0.02 else "Low"
        return metadata
    except Exception:
        pass

    # Fallback inspection via pydub
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(file_path)
        metadata["duration_sec"] = round(len(audio) / 1000.0, 2)
        metadata["sample_rate"] = audio.frame_rate
        metadata["channels"] = audio.channels
        metadata["rms_energy"] = round(audio.rms / 32768.0, 4)
        return metadata
    except Exception:
        pass

    return metadata


def get_video_metadata(file_path: str) -> Dict[str, Any]:
    """
    Extracts video duration, resolution, frame rate, and frame count.
    Uses cv2 or av if available.
    """
    metadata: Dict[str, Any] = {
        "file_name": os.path.basename(file_path),
        "file_size_mb": round(os.path.getsize(file_path) / (1024 * 1024), 2),
        "format": Path(file_path).suffix.lower().replace(".", ""),
        "duration_sec": 0.0,
        "resolution": "Unknown",
        "fps": 0.0,
        "frame_count": 0,
    }

    try:
        import cv2
        cap = cv2.VideoCapture(file_path)
        if cap.isOpened():
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = frame_count / fps if fps > 0 else 0.0

            metadata["fps"] = round(float(fps), 2)
            metadata["frame_count"] = frame_count
            metadata["resolution"] = f"{width}x{height}"
            metadata["duration_sec"] = round(float(duration), 2)
            cap.release()
            return metadata
    except Exception:
        pass

    return metadata
