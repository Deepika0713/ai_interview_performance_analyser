"""
Pipeline integration stubs for Phase 2 (Speech & Acoustics) and Phase 3 (Visual & Non-Verbal).
These modules outline the API contracts and mock pipeline execution for candidate evaluation.
"""

import time
import random
from typing import Dict, Any


def run_phase2_speech_analysis(media_path: str, target_role: str, question: str) -> Dict[str, Any]:
    """
    Phase 2 Integration Placeholder:
    - Audio Transcription via Whisper / Conformer
    - Acoustic Feature Extraction via Librosa (Pace WPM, Pitch, Jitter)
    - Filler Word Detection ('um', 'ah', 'like', 'you know')
    - Silence & Pauses Distribution
    """
    time.sleep(1.2)  # Simulates ML audio processing
    
    # Placeholder analysis output
    wpm = random.randint(128, 155)
    filler_count = random.randint(2, 6)
    clarity_score = random.randint(82, 95)
    pause_ratio = round(random.uniform(0.08, 0.18), 2)

    return {
        "status": "completed",
        "phase": "Phase 2 - Speech & Acoustic Intelligence",
        "metrics": {
            "speech_rate_wpm": wpm,
            "wpm_rating": "Optimal (130-160 WPM)" if 130 <= wpm <= 160 else "Review Pace",
            "filler_words_detected": filler_count,
            "filler_examples": ["um", "like", "basically"][:filler_count],
            "pause_ratio_percent": int(pause_ratio * 100),
            "articulation_clarity_score": clarity_score,
            "energy_consistency": "Consistent & Engaging",
        },
        "transcript_excerpt": (
            f"Candidate response to '{question}': Discussed structured problem solving, "
            f"technical trade-offs, and team collaboration tailored for {target_role}."
        ),
        "feedback_bullets": [
            "Good vocal cadence with clear articulation on key technical terms.",
            f"Detected {filler_count} filler hesitations. Try replacing fillers with deliberate 1-second pauses.",
            "Speaking volume remained balanced throughout the submission.",
        ],
    }


def run_phase3_visual_analysis(media_path: str, is_video: bool) -> Dict[str, Any]:
    """
    Phase 3 Integration Placeholder:
    - Facial Landmark Tracking & Eye Gaze Stability
    - Micro-expression & Confidence Scoring
    - Head Pose Variation & Posture Stability
    """
    time.sleep(1.0)  # Simulates OpenCV / MediaPipe processing
    
    if not is_video:
        return {
            "status": "skipped",
            "phase": "Phase 3 - Visual & Non-Verbal Analytics",
            "note": "Audio-only submission provided. Video facial analysis skipped.",
            "metrics": {},
        }

    eye_contact = random.randint(78, 92)
    confidence_index = random.randint(80, 94)
    head_stability = random.randint(84, 96)

    return {
        "status": "completed",
        "phase": "Phase 3 - Visual & Non-Verbal Analytics",
        "metrics": {
            "eye_contact_ratio": f"{eye_contact}%",
            "eye_contact_status": "Strong Direct Gaze" if eye_contact >= 80 else "Moderate",
            "confidence_index": f"{confidence_index}/100",
            "head_pose_stability": f"{head_stability}%",
            "expressiveness": "Natural & Professional",
            "lighting_quality": "Sufficient",
        },
        "feedback_bullets": [
            f"Maintained camera focus {eye_contact}% of the time, conveying high authority.",
            "Good posture alignment without excessive tilting or fidgeting.",
            "Facial demeanor demonstrated positive engagement with the prompt.",
        ],
    }
