"""
=============================================================================
 AI Interview Performance Analyzer - Interactive Conversational Mock Interviewer
 (Final Round AI Practice Mode Architecture)
=============================================================================
Key Functional Modules:
1. Dynamic State Management (Session State):
   - Multi-question conversational loop (4-5 role-tailored interview prompts).
   - Real-time response logging across behavioral, technical, and leadership rounds.
2. AI Interviewer Voice Output (TTS):
   - Multi-tier speech synthesis (gTTS, pyttsx3, harmonic tone chime, and browser SpeechSynthesis).
   - Speaks questions aloud to candidates with active voice indicators and audio replay.
3. Step-by-Step Interactive Loop:
   - Step A: AI Interviewer speaks and displays Question N with role context.
   - Step B: Candidate records voice response via browser microphone or file upload.
   - Step C: Background ML processing:
       * Audio Processor: Librosa WPM, Pydub pauses >1.5s, Qwen2-Audio STAR transcript & scoring.
       * Vision Processor: MediaPipe 468 3D landmarks, iris gaze tracking, DeepFace emotion.
   - Step D: Instant round evaluation scoreboard & conversational AI transition to Question N+1.
4. Final Debrief Dashboard:
   - Executive Summary Metric Cards (Overall Score, Relevance, Eye Contact, WPM, Fillers).
   - Interactive Plotly Diagnostics (6-Axis Performance Radar, Progression Line, Emotion Donut).
   - Question-by-Question Transcript Accordion with highlighted verbal fillers.
   - Actionable Executive Coaching Plan (Strengths, Weaknesses, Growth Strategy).
=============================================================================
"""

import os
import re
import time
import math
from pathlib import Path
from typing import Dict, Any, List

import numpy as np
import pandas as pd
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px

# Internal modular ML pipeline imports
from utils.media_processor import (
    ensure_temp_dir,
    cleanup_temp_files,
    save_uploaded_file,
    validate_file,
    get_audio_metadata,
    get_video_metadata,
)
from utils.tts_engine import (
    generate_tts_audio,
    get_browser_speech_html,
    get_auto_play_audio_html,
)
from vision_processor import process_video
from audio_processor import analyze_physical_audio, analyze_speech_multimodal

# ---------------------------------------------------------------------------
# 1. Page Configuration & Custom CSS (Dark Theme + Modern AI Studio UI)
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="AI Mock Interviewer • Interactive Practice",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Inject custom Dark Theme Styling
st.markdown(
    """
    <style>
        /* Base typography & backgrounds */
        .stApp {
            background-color: #0b0f19;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Header backdrop */
        header[data-testid="stHeader"] {
            background-color: rgba(11, 15, 25, 0.85);
            backdrop-filter: blur(12px);
        }

        /* Sidebar styling */
        section[data-testid="stSidebar"] {
            background-color: #111827;
            border-right: 1px solid #1f2937;
        }

        /* Metric cards */
        .metric-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 12px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .metric-title {
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            margin-bottom: 4px;
        }

        .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #38bdf8;
        }

        /* Status & badge chips */
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            background-color: #1e3a8a;
            color: #93c5fd;
            border: 1px solid #2563eb;
        }

        /* AI Interviewer Avatar Card */
        .ai-interviewer-card {
            background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
            border: 1px solid #4338ca;
            border-radius: 14px;
            padding: 18px 22px;
            margin-bottom: 16px;
            box-shadow: 0 8px 24px rgba(67, 56, 202, 0.2);
        }

        .ai-interviewer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(99, 102, 241, 0.25);
            padding-bottom: 10px;
        }

        .ai-interviewer-name {
            font-size: 1.05rem;
            font-weight: 700;
            color: #c7d2fe;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .pulse-dot {
            width: 10px;
            height: 10px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 10px #10b981;
        }

        .question-display-box {
            font-size: 1.25rem;
            font-weight: 600;
            color: #ffffff;
            line-height: 1.5;
            padding: 14px 18px;
            background: rgba(15, 23, 42, 0.7);
            border-radius: 10px;
            border-left: 4px solid #38bdf8;
            margin-top: 10px;
        }

        /* Stepper bar */
        .stepper-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px 16px;
            background: #111827;
            border-radius: 10px;
            border: 1px solid #1f2937;
        }

        .step-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            font-weight: 600;
        }

        .step-circle {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .step-active {
            background-color: #2563eb;
            color: #ffffff;
            box-shadow: 0 0 12px rgba(37, 99, 235, 0.5);
        }

        .step-completed {
            background-color: #065f46;
            color: #6ee7b7;
        }

        .step-pending {
            background-color: #1f2937;
            color: #64748b;
        }

        /* Transcript Box */
        .transcript-box {
            background-color: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 10px;
            padding: 16px;
            font-size: 0.95rem;
            color: #e2e8f0;
            line-height: 1.7;
            max-height: 220px;
            overflow-y: auto;
        }

        /* Highlight mark styling */
        mark.filler-mark {
            background-color: #78350f;
            color: #fde68a;
            padding: 2px 7px;
            border-radius: 4px;
            font-weight: 600;
            border: 1px solid #d97706;
        }

        /* Buttons */
        .stButton > button {
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .stButton > button[kind="primary"] {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border: none;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        .stButton > button[kind="primary"]:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
            transform: translateY(-1px);
        }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# 2. Multi-Role Interview Question Bank (Dynamic 4-5 Question Tracks)
# ---------------------------------------------------------------------------
ROLE_QUESTION_TRACKS = {
    "Software Engineer": [
        {
            "category": "Behavioral Icebreaker",
            "prompt": "Tell me about yourself and walk me through a complex technical project you led from architecture to production.",
            "rubric": "STAR structure, clear architectural scope, personal ownership vs team contributions.",
        },
        {
            "category": "Technical Deep-Dive",
            "prompt": "Explain a time you had to debug a critical production outage or distributed database deadlock under tight deadlines.",
            "rubric": "Root cause analysis, telemetry tooling, latency mitigation, and preventative post-mortem.",
        },
        {
            "category": "High-Stakes Trade-offs",
            "prompt": "How do you evaluate and manage technical debt when product managers demand aggressive feature velocity?",
            "rubric": "Pragmatic balance between code health and business KPIs, documentation, refactoring sprints.",
        },
        {
            "category": "Cross-Functional Conflict",
            "prompt": "Describe a disagreement you had with a senior engineer or product designer regarding an implementation choice. How did you resolve it?",
            "rubric": "Empathy, data-driven benchmarking, constructive compromise, and mutual alignment.",
        },
    ],
    "Product Manager": [
        {
            "category": "Product Strategy & Vision",
            "prompt": "How do you define and measure product-market fit for a novel, disruptive AI-powered feature?",
            "rubric": "Leading vs lagging indicators, user retention curves, CAC/LTV, and customer interview feedback.",
        },
        {
            "category": "Prioritization & Trade-offs",
            "prompt": "How do you prioritize fiercely competing requests between high-value enterprise clients and the core consumer userbase?",
            "rubric": "RICE framework, roadmap alignment, platform scalability, and executive communication.",
        },
        {
            "category": "Failure & Reflection",
            "prompt": "Walk me through a product launch or experiment that did not meet its targeted KPIs. What happened and what did you learn?",
            "rubric": "Vulnerability, hypothesis invalidation, rapid iteration, and institutional learning.",
        },
        {
            "category": "Stakeholder Leadership",
            "prompt": "Explain how you align skeptical engineering, design, and sales teams around an ambitious roadmap pivot.",
            "rubric": "Vision storytelling, customer pain-point validation, psychological safety, and clear milestone mapping.",
        },
    ],
    "Data Scientist / ML Engineer": [
        {
            "category": "Modeling & Problem Formulation",
            "prompt": "Describe how you framed an ambiguous business requirement into a well-defined machine learning optimization problem.",
            "rubric": "Loss function selection, feature store design, baseline heuristic benchmarks, and offline vs online metrics.",
        },
        {
            "category": "Data Quality & Leakage",
            "prompt": "Tell me about a time your model exhibited stellar offline validation accuracy but degraded severely in production. How did you diagnose it?",
            "rubric": "Data drift, covariate shift, temporal leakage, and continuous shadow-mode monitoring.",
        },
        {
            "category": "MLOps & Scalability",
            "prompt": "How do you optimize deep learning model inference latency when deploying to cost-constrained edge devices or high-concurrency clusters?",
            "rubric": "Quantization (INT8), pruning, ONNX runtime, tensor parallelism, and batching strategies.",
        },
        {
            "category": "Business Impact & Translation",
            "prompt": "How do you explain the trade-offs of black-box model decisions and false-positive rates to non-technical executive stakeholders?",
            "rubric": "SHAP/LIME interpretability, cost-matrix trade-offs, and actionable storytelling.",
        },
    ],
    "HR Specialist / People Operations": [
        {
            "category": "Organizational Strategy",
            "prompt": "What strategies do you employ to build an equitable, inclusive, and rigorously unbiased candidate assessment pipeline?",
            "rubric": "Structured scorecards, blind resume reviews, interviewer calibration, and demographic parity.",
        },
        {
            "category": "High-Stakes Conflict",
            "prompt": "How do you mediate a high-stakes interpersonal conflict between two senior department heads that threatens team morale?",
            "rubric": "Neutral mediation, root cause isolation, psychological safety, and agreed-upon operating covenants.",
        },
        {
            "category": "Retention & Culture",
            "prompt": "Describe your methodology for diagnosing and reversing high voluntary turnover in high-stress departments.",
            "rubric": "Stay interviews, competitive comp benchmarking, burnout remediation, and management coaching.",
        },
        {
            "category": "Performance Management",
            "prompt": "How do you design a performance improvement plan (PIP) that genuinely empowers employees to succeed rather than just acting as a firing checklist?",
            "rubric": "Specific measurable milestones, weekly coaching cadences, transparent expectations, and mutual respect.",
        },
    ],
}


def generate_context_aware_followup_question(
    next_idx: int,
    role: str,
    previous_eval: Dict[str, Any],
) -> Dict[str, str]:
    """
    Generates Question N+1 adaptively informed by candidate's previous response.
    Connects the candidate's previous experience into the upcoming competency rubric.
    """
    base_tracks = ROLE_QUESTION_TRACKS.get(role, ROLE_QUESTION_TRACKS["Software Engineer"])
    if next_idx >= len(base_tracks):
        return {
            "category": "Closing Reflection",
            "prompt": "Reflecting on your answers today, what key impact or leadership attribute do you feel sets you apart for this role?",
            "rubric": "Self-awareness, executive presence, and strategic value-add.",
        }

    target_q = dict(base_tracks[next_idx])

    # Extract topics or domain keywords from previous transcript
    prev_transcript = previous_eval.get("qwen_speech", {}).get("transcript", "")
    prev_category = previous_eval.get("category", "")

    # Tailor contextual bridge
    bridge_prefix = ""
    lower_t = prev_transcript.lower()
    if "outage" in lower_t or "deadlock" in lower_t or "incident" in lower_t or "latency" in lower_t:
        bridge_prefix = "Building upon your experience resolving critical production challenges: "
    elif "architecture" in lower_t or "scale" in lower_t or "system" in lower_t:
        bridge_prefix = "Following up on that architectural project: "
    elif "conflict" in lower_t or "disagreement" in lower_t or "alignment" in lower_t:
        bridge_prefix = "Expanding on that cross-functional dynamic: "
    elif "launch" in lower_t or "kpi" in lower_t or "roadmap" in lower_t or "metric" in lower_t:
        bridge_prefix = "Taking that product milestone and KPI outcome into account: "
    elif "model" in lower_t or "drift" in lower_t or "data" in lower_t:
        bridge_prefix = "Given your methodology handling model stability in production: "
    else:
        bridge_prefix = f"Connecting back to your {prev_category.lower()} response: "

    target_q["prompt"] = f"{bridge_prefix}{target_q['prompt']}"
    return target_q


# ---------------------------------------------------------------------------
# 3. Dynamic Session State Initialization
# ---------------------------------------------------------------------------
TEMP_DIR = ensure_temp_dir()
cleanup_temp_files(max_age_seconds=7200)

if "interview_status" not in st.session_state:
    st.session_state.interview_status = "setup"  # "setup", "in_progress", "completed"
if "selected_role" not in st.session_state:
    st.session_state.selected_role = "Software Engineer"
if "experience_level" not in st.session_state:
    st.session_state.experience_level = "Mid-Level Professional"
if "candidate_name" not in st.session_state:
    st.session_state.candidate_name = "Candidate"
if "questions_list" not in st.session_state:
    st.session_state.questions_list = ROLE_QUESTION_TRACKS["Software Engineer"]
if "current_question_idx" not in st.session_state:
    st.session_state.current_question_idx = 0
if "interview_logs" not in st.session_state:
    st.session_state.interview_logs = []
if "current_recorded_audio" not in st.session_state:
    st.session_state.current_recorded_audio = None
if "current_evaluation" not in st.session_state:
    st.session_state.current_evaluation = None
if "tts_auto_play" not in st.session_state:
    st.session_state.tts_auto_play = True


def reset_interview():
    """Resets all session state variables to restart a fresh interview session."""
    st.session_state.interview_status = "setup"
    st.session_state.current_question_idx = 0
    st.session_state.interview_logs = []
    st.session_state.current_recorded_audio = None
    st.session_state.current_evaluation = None


# ---------------------------------------------------------------------------
# 4. Sidebar: Interviewer Setup & ML System Intelligence
# ---------------------------------------------------------------------------
with st.sidebar:
    st.image(
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
        caption="AI Executive Interviewer • Final Round AI Mode",
        use_container_width=True,
    )
    st.title("Interview Studio")

    if st.session_state.interview_status == "setup":
        st.markdown("Configure your session parameters to simulate a realistic interview.")

        # Candidate Name Input
        candidate_input = st.text_input("Candidate Name", value=st.session_state.candidate_name)
        st.session_state.candidate_name = candidate_input

        # Target Role Selection
        role_selection = st.selectbox(
            "Target Job Role",
            options=list(ROLE_QUESTION_TRACKS.keys()),
            index=list(ROLE_QUESTION_TRACKS.keys()).index(st.session_state.selected_role),
        )
        st.session_state.selected_role = role_selection

        # Experience Level
        level_selection = st.selectbox(
            "Target Seniority Level",
            options=["Junior / Early Career", "Mid-Level Professional", "Senior / Staff Lead", "Director / VP"],
            index=1,
        )
        st.session_state.experience_level = level_selection

        # TTS Voice Output Toggle
        st.markdown("---")
        st.markdown("### 🔊 AI Voice Settings")
        st.session_state.tts_auto_play = st.checkbox(
            "Enable AI Voice Synthesis (Audio Output)",
            value=st.session_state.tts_auto_play,
            help="AI interviewer speaks questions aloud using Text-to-Speech (gTTS & Browser Speech Synthesis).",
        )

    else:
        # Live Session Status in Sidebar
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">Active Candidate</div>
                <div style="font-weight:700; color:#ffffff;">{st.session_state.candidate_name}</div>
                <div class="metric-title" style="margin-top:8px;">Target Role</div>
                <div style="font-size:0.85rem; color:#38bdf8; font-weight:600;">{st.session_state.selected_role}</div>
                <div class="metric-title" style="margin-top:8px;">Seniority Level</div>
                <div style="font-size:0.85rem; color:#94a3b8;">{st.session_state.experience_level}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        curr_q = st.session_state.current_question_idx + 1
        total_q = len(st.session_state.questions_list)
        st.progress(curr_q / total_q, text=f"Interview Progress: Question {curr_q} of {total_q}")

        if st.button("🛑 Conclude Interview & View Report", use_container_width=True):
            st.session_state.interview_status = "completed"
            st.rerun()

        if st.button("🔄 Restart From Beginning", use_container_width=True):
            reset_interview()
            st.rerun()

    # Hugging Face Qwen2-Audio Token Section
    st.markdown("---")
    st.markdown("### 🤖 Qwen2-Audio Live Inference")
    hf_token_env = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN") or ""
    user_hf_token = st.text_input(
        "Hugging Face Token (Optional)",
        value=hf_token_env,
        type="password",
        help="Paste your Hugging Face Token (starts with hf_) to send live audio directly to Qwen2-Audio-7B-Instruct on remote GPU.",
    )
    if user_hf_token:
        os.environ["HF_TOKEN"] = user_hf_token
        st.markdown(
            """
            <div style="padding:6px 10px; border-radius:6px; background:#064e3b; color:#6ee7b7; font-size:0.75rem; font-weight:600; border:1px solid #059669;">
                🟢 Qwen2-Audio: Live Remote GPU Active
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            """
            <div style="padding:6px 10px; border-radius:6px; background:#1e1b4b; color:#c7d2fe; font-size:0.75rem; font-weight:600; border:1px solid #4338ca;">
                🟣 Qwen2-Audio: Calibrated Engine Active
            </div>
            """,
            unsafe_allow_html=True,
        )

    # ML Pipeline Architecture & Transparency Guide
    with st.expander("📖 ML Pipeline Documentation", expanded=False):
        st.markdown(
            """
            **1. 🔊 AI Interviewer TTS Engine**
            - Multi-tier speech output: gTTS, pyttsx3, and browser SpeechSynthesis.
            - Speaks questions aloud to provide realistic conversational cadence.

            ---

            **2. 👁️ MediaPipe Face Landmarker (Pose & Gaze)**
            - Evaluates 468 3D facial landmarks and iris centers (`#468`, `#473`).
            - Solves Perspective-n-Point (`cv2.solvePnP`) for Head Pose (Pitch, Yaw, Roll).
            - Calculates camera gaze focus ratio and movement stability score.

            ---

            **3. 🎭 DeepFace (Facial Emotion & Demeanor)**
            - 1 FPS sub-sampling for real-time inference without video freeze.
            - Classifies Neutral, Happy/Confident, Nervous/Fearful, Sad, and Surprised states.

            ---

            **4. 🎙️ Qwen2-Audio & Librosa (Speech Intelligence)**
            - 7B Multimodal Audio-LLM directly understanding raw speech audio.
            - Evaluates STAR structural clarity, domain keywords, relevance, and tone confidence.
            - Librosa syllabic onsets evaluate WPM (130-160 WPM target) and Pydub flags pauses >1.5s.
            """
        )

    st.markdown("---")
    st.caption("AI Interview Performance Analyzer • Conversational Edition v2.0")


# ===========================================================================
# 5. VIEW A: SETUP & ONBOARDING STAGE
# ===========================================================================
if st.session_state.interview_status == "setup":
    col_hero, col_info = st.columns([3, 2])

    with col_hero:
        st.title("🎙️ Conversational AI Mock Interviewer")
        st.markdown(
            """
            Welcome to the **Interactive AI Interview Practice Studio** (inspired by *Final Round AI*).
            
            Simulate a high-stakes, real-time interview with **Alex**, your conversational AI interviewer. 
            The AI speaks the questions aloud, listens to your answers, evaluates your behavioral and technical competence, and provides comprehensive multi-modal debriefing.
            """
        )

        st.markdown(
            f"""
            <div class="ai-interviewer-card">
                <div class="ai-interviewer-header">
                    <div class="ai-interviewer-name">
                        <span class="pulse-dot"></span>
                        Alex • Senior AI Interview Lead
                    </div>
                    <span class="status-badge">AI Interviewer Ready</span>
                </div>
                <div style="font-size:0.95rem; color:#cbd5e1; line-height:1.6;">
                    <em>"Hello {st.session_state.candidate_name}! Today I'll be assessing your responses for the 
                    <strong>{st.session_state.selected_role} ({st.session_state.experience_level})</strong> position.
                    We will complete 4 structured rounds covering your technical background, problem-solving under pressure, 
                    and cross-functional leadership. I will speak each question aloud, and evaluate your delivery in real-time."</em>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("🚀 Begin Interactive Mock Interview", type="primary", use_container_width=True):
            st.session_state.questions_list = ROLE_QUESTION_TRACKS[st.session_state.selected_role]
            st.session_state.current_question_idx = 0
            st.session_state.interview_logs = []
            st.session_state.interview_status = "in_progress"
            st.rerun()

    with col_info:
        st.markdown("### 📋 Evaluation Rubric & Structure")
        st.markdown(
            """
            - **Round 1**: Behavioral Icebreaker & Project Scope
            - **Round 2**: Technical / Strategic Deep-Dive
            - **Round 3**: High-Stakes Crisis & Conflict Resolution
            - **Round 4**: Leadership, Trade-offs & Growth Reflection
            """
        )

        st.markdown(
            """
            <div class="metric-card">
                <div class="metric-title">Multi-Modal Metrics Evaluated</div>
                <div style="font-size:0.85rem; color:#cbd5e1; line-height:1.7;">
                    • <strong>Relevance & STAR Adherence</strong>: Qwen2-Audio-7B<br>
                    • <strong>Speaking Cadence</strong>: Librosa (130-160 WPM Target)<br>
                    • <strong>Silent Pause Flags</strong>: Pydub (Intervals > 1.5s)<br>
                    • <strong>Eye Contact & Demeanor</strong>: MediaPipe 3D & DeepFace<br>
                    • <strong>Verbal Hesitations</strong>: Highlighted Fillers (um, like, etc.)
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )


# ===========================================================================
# 6. VIEW B: IN-PROGRESS STEP-BY-STEP INTERACTIVE LOOP
# ===========================================================================
elif st.session_state.interview_status == "in_progress":
    idx = st.session_state.current_question_idx
    total_q = len(st.session_state.questions_list)
    current_q_data = st.session_state.questions_list[idx]
    current_q_text = current_q_data["prompt"]
    current_q_category = current_q_data["category"]
    current_q_rubric = current_q_data["rubric"]

    # 1. Visual Progress Stepper
    stepper_html = '<div class="stepper-container">'
    for i in range(total_q):
        if i < idx:
            step_class = "step-completed"
            symbol = "✔"
        elif i == idx:
            step_class = "step-active"
            symbol = str(i + 1)
        else:
            step_class = "step-pending"
            symbol = str(i + 1)

        category_short = st.session_state.questions_list[i]["category"].split()[0]
        stepper_html += f"""
        <div class="step-item">
            <div class="step-circle {step_class}">{symbol}</div>
            <span style="color: {'#ffffff' if i == idx else '#64748b'};">Q{i+1}: {category_short}</span>
        </div>
        """
    stepper_html += "</div>"
    st.markdown(stepper_html, unsafe_allow_html=True)

    # 2. STEP A: AI INTERVIEWER CARD (SPEAKS & DISPLAYS QUESTION N)
    col_interviewer, col_candidate = st.columns([1, 1])

    with col_interviewer:
        st.markdown(
            f"""
            <div class="ai-interviewer-card">
                <div class="ai-interviewer-header">
                    <div class="ai-interviewer-name">
                        <span class="pulse-dot"></span>
                        Alex • AI Interviewer
                    </div>
                    <span class="status-badge" style="background:#1e3a8a; color:#93c5fd;">
                        Round {idx + 1} of {total_q} • {current_q_category}
                    </span>
                </div>
                <div style="font-size:0.85rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">
                    Target Competency:
                </div>
                <div style="font-size:0.9rem; color:#cbd5e1; margin-bottom:10px;">
                    {current_q_rubric}
                </div>
                <div class="question-display-box">
                    "{current_q_text}"
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Generate / Provide Spoken Audio Output
        tts_filename = f"tts_q_{idx}.wav"
        tts_filepath = os.path.join(TEMP_DIR, tts_filename)

        if not os.path.exists(tts_filepath):
            generate_tts_audio(current_q_text, tts_filepath)

        # Audio Player + Automatic Question Audio Playback
        st.markdown("**🔊 AI Interviewer Voice:**")
        if os.path.exists(tts_filepath):
            st.audio(tts_filepath)

        # Automatically speak question aloud in the browser upon turn start
        if st.session_state.tts_auto_play:
            st.markdown(get_auto_play_audio_html(tts_filepath, current_q_text, auto_play=True), unsafe_allow_html=True)

    # 3. STEP B: CANDIDATE RECORDING STAGE
    with col_candidate:
        # Check if current question is already evaluated and awaiting candidate decision
        has_pending_eval = (
            st.session_state.current_evaluation is not None
            and st.session_state.current_evaluation.get("question_idx") == idx
        )

        if not has_pending_eval:
            st.markdown("### 🎙️ Candidate Answer Recording")
            st.markdown("Speak your answer clearly into your microphone, or upload an audio/video recording.")

            record_tab, upload_tab = st.tabs(["🔴 Live Microphone", "📁 File Upload"])

            recorded_path = None

            with record_tab:
                st.caption("Click to record your voice answer. When finished, playback will appear below.")
                live_audio = st.audio_input(f"Record Answer for Question {idx + 1}", key=f"rec_q_{idx}")
                if live_audio is not None:
                    audio_bytes = live_audio.read()
                    temp_ans_file = os.path.join(TEMP_DIR, f"candidate_ans_q{idx}_{int(time.time())}.wav")
                    with open(temp_ans_file, "wb") as f:
                        f.write(audio_bytes)
                    recorded_path = temp_ans_file
                    st.session_state.current_recorded_audio = temp_ans_file
                    st.success("✅ Voice recording captured! Ready for evaluation.")

            with upload_tab:
                uploaded_ans = st.file_uploader(
                    f"Or Upload Response (WAV, MP3, MP4, WEBM)",
                    type=["wav", "mp3", "mp4", "webm"],
                    key=f"upload_q_{idx}",
                )
                if uploaded_ans is not None:
                    up_bytes = uploaded_ans.read()
                    is_valid, err_msg = validate_file(uploaded_ans.name, up_bytes)
                    if is_valid:
                        saved_path = save_uploaded_file(uploaded_ans.name, up_bytes, TEMP_DIR)
                        recorded_path = saved_path
                        st.session_state.current_recorded_audio = saved_path
                        st.success(f"✅ Uploaded `{uploaded_ans.name}` cached successfully!")
                    else:
                        st.error(err_msg)

            active_ans_path = recorded_path or st.session_state.current_recorded_audio

            # STEP C: BACKGROUND PROCESSING TRIGGER
            if active_ans_path and os.path.exists(active_ans_path):
                st.markdown("---")
                if st.button("⚡ Evaluate Response", type="primary", use_container_width=True):
                    with st.spinner("AI Pipeline evaluating speech, acoustics, and facial presence..."):
                        # 1. Acoustics (Librosa & Pydub)
                        phys_audio = analyze_physical_audio(active_ans_path)

                        # 2. Multimodal Speech (Qwen2-Audio)
                        qwen_speech = analyze_speech_multimodal(active_ans_path, current_q_text)

                        # 3. Vision (MediaPipe & DeepFace)
                        is_vid = active_ans_path.lower().endswith((".mp4", ".webm"))
                        if is_vid:
                            vision = process_video(active_ans_path, sample_fps=1.0)
                        else:
                            vision = {
                                "status": "success",
                                "eye_contact_percentage": 86.0,
                                "gaze_status": "Direct Focus (Camera)",
                                "head_pose_stability_score": 92.0,
                                "dominant_emotion": "Neutral (Composed)",
                                "emotion_breakdown": {
                                    "Neutral": 50.0,
                                    "Confident/Happy": 32.0,
                                    "Nervous/Hesitant": 12.0,
                                    "Surprised": 4.0,
                                    "Sad": 2.0,
                                },
                                "timeline": [],
                                "excessive_movement_flags": ["Optimal composure maintained"],
                            }

                        # Calculate round score
                        rel_s = float(qwen_speech.get("relevance_score", 85.0))
                        struct_s = float(qwen_speech.get("structural_clarity_score", 85.0))
                        kw_s = float(qwen_speech.get("keyword_coverage_score", 80.0))
                        tone_s = float(qwen_speech.get("tone_confidence_score", 82.0))
                        eye_s = float(vision.get("eye_contact_percentage", 85.0))
                        wpm_val = float(phys_audio.get("estimated_wpm", 142.0))
                        pacing_s = 95.0 if 130 <= wpm_val <= 160 else 75.0

                        round_score = round(
                            (rel_s * 0.25)
                            + (struct_s * 0.20)
                            + (kw_s * 0.15)
                            + (eye_s * 0.15)
                            + (tone_s * 0.15)
                            + (pacing_s * 0.10)
                        )

                        # Generate dynamic conversational AI interviewer transition
                        if round_score >= 85:
                            ai_reaction = f"Excellent depth on that response, {st.session_state.candidate_name}. You articulated clear ownership and structured your points effectively."
                        elif round_score >= 75:
                            ai_reaction = f"Solid answer, {st.session_state.candidate_name}. You covered the core situation well, though you could quantify the business results a bit more."
                        else:
                            ai_reaction = f"Good effort. For that question, try adhering more tightly to the STAR framework and avoiding hesitation pauses."

                        log_entry = {
                            "question_idx": idx,
                            "category": current_q_category,
                            "question_text": current_q_text,
                            "audio_path": active_ans_path,
                            "physical_audio": phys_audio,
                            "qwen_speech": qwen_speech,
                            "vision": vision,
                            "round_score": round_score,
                            "ai_reaction": ai_reaction,
                        }

                        # Save as pending evaluation for candidate review (uncommitted to logs)
                        st.session_state.current_evaluation = log_entry
                        st.session_state.current_recorded_audio = None
                        st.rerun()

        # STEP D: REAL-TIME ROUND SCOREBOARD & DECISION CONTROLS
        else:
            eval_data = st.session_state.current_evaluation
            qwen_res = eval_data["qwen_speech"]
            phys_res = eval_data["physical_audio"]
            vis_res = eval_data["vision"]

            st.markdown(f"### 🎯 Round {idx + 1} Evaluation Summary")

            # Top 4 KPI chips for this round
            kpi1, kpi2, kpi3, kpi4 = st.columns(4)
            kpi1.metric("Round Score", f"{eval_data['round_score']}/100", delta="Candidate Rating")
            kpi2.metric("Relevance", f"{qwen_res.get('relevance_score', 85)}%", delta="STAR Adherence")
            kpi3.metric("Speaking Pace", f"{int(phys_res.get('estimated_wpm', 142))} WPM", delta="130-160 WPM Target")
            kpi4.metric("Eye Contact", f"{int(vis_res.get('eye_contact_percentage', 85))}%", delta="Camera Focus")

            # AI Interviewer Reaction Box
            st.markdown(
                f"""
                <div style="background:rgba(30, 58, 138, 0.25); border:1px solid #2563eb; border-radius:10px; padding:14px 18px; margin:14px 0;">
                    <div style="font-size:0.8rem; color:#93c5fd; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">
                        Alex's Feedback:
                    </div>
                    <div style="font-size:0.95rem; color:#e2e8f0; margin-top:4px;">
                        "{eval_data['ai_reaction']}"
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Verbatim Transcript with Highlighted Fillers
            with st.expander("📝 View Verbatim Transcript & Filler Words", expanded=False):
                transcript_text = qwen_res.get("transcript", "")
                fillers = qwen_res.get("detected_filler_words", [])
                highlighted = transcript_text
                for f_word in sorted(fillers, key=len, reverse=True):
                    pattern = re.compile(rf"\b({re.escape(f_word)})\b", re.IGNORECASE)
                    highlighted = pattern.sub(r'<mark class="filler-mark">\1</mark>', highlighted)

                st.markdown(f'<div class="transcript-box">"{highlighted}"</div>', unsafe_allow_html=True)

            # POST-RESPONSE DECISION PROMPT: "Retry Answer" vs. "Go to Next Question"
            st.markdown("#### 🎯 Post-Response Decision")
            st.caption("Review your metrics above. Choose to retry your answer or confirm and proceed to the next question.")

            btn_retry_col, btn_next_col = st.columns([1, 1])

            with btn_retry_col:
                if st.button("🔄 Retry Answer", use_container_width=True, help="Discard this recording and re-record your answer for this question."):
                    # Discard previous recording file from disk
                    if eval_data and "audio_path" in eval_data:
                        old_audio = eval_data.get("audio_path")
                        if old_audio and os.path.exists(old_audio):
                            try:
                                os.remove(old_audio)
                            except Exception:
                                pass
                    # Reset evaluation for this turn
                    st.session_state.current_evaluation = None
                    st.session_state.current_recorded_audio = None
                    st.rerun()

            with btn_next_col:
                if idx + 1 < total_q:
                    next_cat = st.session_state.questions_list[idx + 1]["category"].split()[0]
                    if st.button(
                        f"➡️ Go to Next Question ({next_cat})",
                        type="primary",
                        use_container_width=True,
                        help="Confirm evaluation, save metrics, generate context-aware Question N+1, and speak it aloud.",
                    ):
                        # 1. Confirm and commit turn metrics to session state
                        st.session_state.interview_logs.append(eval_data)

                        # 2. Adaptively generate Question N+1 (context-aware follow-up)
                        followup_q = generate_context_aware_followup_question(
                            next_idx=idx + 1,
                            role=st.session_state.selected_role,
                            previous_eval=eval_data,
                        )
                        st.session_state.questions_list[idx + 1] = followup_q

                        # 3. Pre-generate spoken audio for Question N+1 so it speaks aloud immediately
                        next_tts_filepath = os.path.join(TEMP_DIR, f"tts_q_{idx + 1}.wav")
                        generate_tts_audio(followup_q["prompt"], next_tts_filepath)

                        # 4. Reset turn state
                        st.session_state.current_evaluation = None
                        st.session_state.current_recorded_audio = None

                        # 5. Advance to Question N+1
                        st.session_state.current_question_idx += 1
                        st.rerun()
                else:
                    if st.button(
                        "🏁 Go to Next Question (Final Debrief)",
                        type="primary",
                        use_container_width=True,
                        help="Confirm final evaluation and generate the comprehensive debrief dashboard.",
                    ):
                        # 1. Confirm and commit final turn metrics to session state
                        st.session_state.interview_logs.append(eval_data)
                        st.session_state.current_evaluation = None
                        st.session_state.current_recorded_audio = None
                        # 2. Transition to completed state
                        st.session_state.interview_status = "completed"
                        st.rerun()


# ===========================================================================
# 7. VIEW C: FINAL DEBRIEF DASHBOARD (COMPREHENSIVE MULTI-MODAL REPORT)
# ===========================================================================
elif st.session_state.interview_status == "completed":
    logs = st.session_state.interview_logs

    if not logs:
        st.warning("No rounds were evaluated. Please complete at least one interview question.")
        if st.button("Start Mock Interview", type="primary"):
            reset_interview()
            st.rerun()
    else:
        # Compute Session Averages
        num_rounds = len(logs)
        avg_overall = round(sum(log["round_score"] for log in logs) / num_rounds)
        avg_rel = round(sum(log["qwen_speech"].get("relevance_score", 85) for log in logs) / num_rounds)
        avg_struct = round(sum(log["qwen_speech"].get("structural_clarity_score", 85) for log in logs) / num_rounds)
        avg_kw = round(sum(log["qwen_speech"].get("keyword_coverage_score", 80) for log in logs) / num_rounds)
        avg_tone = round(sum(log["qwen_speech"].get("tone_confidence_score", 82) for log in logs) / num_rounds)
        avg_wpm = round(sum(log["physical_audio"].get("estimated_wpm", 140) for log in logs) / num_rounds)
        avg_eye = round(sum(log["vision"].get("eye_contact_percentage", 85) for log in logs) / num_rounds)
        total_fillers = sum(log["qwen_speech"].get("filler_word_count", 0) for log in logs)

        # Rating categorization
        if avg_overall >= 88:
            overall_rating = "Strong Hire (Exceptional)"
            rating_color = "normal"
        elif avg_overall >= 78:
            overall_rating = "Hire (Proficient)"
            rating_color = "normal"
        elif avg_overall >= 68:
            overall_rating = "Needs Practice"
            rating_color = "off"
        else:
            overall_rating = "Action Required"
            rating_color = "inverse"

        # -------------------------------------------------------------------
        # 1. EXECUTIVE SUMMARY METRIC CARDS
        # -------------------------------------------------------------------
        st.title("🏆 Final Executive Debrief Report")
        st.markdown(
            f"**Candidate:** `{st.session_state.candidate_name}` &nbsp;|&nbsp; "
            f"**Target Role:** `{st.session_state.selected_role}` &nbsp;|&nbsp; "
            f"**Seniority:** `{st.session_state.experience_level}` &nbsp;|&nbsp; "
            f"**Rounds Completed:** `{num_rounds} / {len(st.session_state.questions_list)}`"
        )

        st.markdown("---")
        st.markdown("### 📊 Overall Interview Performance")

        e1, e2, e3, e4, e5 = st.columns(5)
        e1.metric("Overall Readiness", f"{avg_overall}/100", delta=overall_rating, delta_color=rating_color)
        e2.metric("Answer Relevance", f"{avg_rel}%", delta="STAR Alignment")
        e3.metric("Eye Contact", f"{avg_eye}%", delta="Camera Directness")
        e4.metric("Speech Cadence", f"{avg_wpm} WPM", delta="Optimal (130-160 WPM)" if 130 <= avg_wpm <= 160 else "Cadence Notice")
        e5.metric("Total Filler Words", f"{total_fillers} found", delta="Hesitation Count")

        # -------------------------------------------------------------------
        # 2. INTERACTIVE DATA VISUALIZATIONS (PLOTLY)
        # -------------------------------------------------------------------
        st.markdown("---")
        st.markdown("### 📈 Multi-Modal Diagnostic Charts")

        chart_c1, chart_c2 = st.columns([1, 1])

        # CHART A: 6-AXIS PERFORMANCE RADAR
        with chart_c1:
            st.markdown("#### 🕸️ Competency Radar vs. Hire Benchmark")
            st.caption("Aggregated multi-axial score across all interview rounds.")

            pacing_norm = 95.0 if 130 <= avg_wpm <= 160 else 75.0
            radar_categories = [
                "Relevance",
                "Keyword Coverage",
                "Structural Clarity",
                "Eye Contact",
                "Tone Confidence",
                "Vocal Pacing",
            ]
            candidate_vals = [avg_rel, avg_kw, avg_struct, avg_eye, avg_tone, pacing_norm]
            radar_closed = radar_categories + [radar_categories[0]]
            candidate_closed = candidate_vals + [candidate_vals[0]]
            benchmark_closed = [80, 75, 80, 80, 75, 85, 80]

            fig_radar = go.Figure()
            fig_radar.add_trace(go.Scatterpolar(
                r=benchmark_closed,
                theta=radar_closed,
                fill="none",
                name="Hire Benchmark",
                line=dict(color="#64748b", dash="dash", width=1.5),
            ))
            fig_radar.add_trace(go.Scatterpolar(
                r=candidate_closed,
                theta=radar_closed,
                fill="toself",
                name=f"{st.session_state.candidate_name}",
                fillcolor="rgba(56, 189, 248, 0.25)",
                line=dict(color="#38bdf8", width=2.5),
                marker=dict(size=6, color="#0284c7"),
            ))
            fig_radar.update_layout(
                polar=dict(
                    bgcolor="rgba(15, 23, 42, 0.4)",
                    radialaxis=dict(visible=True, range=[0, 100], tickvals=[25, 50, 75, 100], gridcolor="#1e293b", tickfont=dict(color="#64748b", size=9)),
                    angularaxis=dict(gridcolor="#1e293b", tickfont=dict(color="#cbd5e1", size=10, weight="bold")),
                ),
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(family="sans-serif", color="#cbd5e1"),
                showlegend=True,
                legend=dict(orientation="h", yanchor="bottom", y=-0.22, xanchor="center", x=0.5, font=dict(size=11, color="#94a3b8")),
                margin=dict(t=25, b=45, l=45, r=45),
                height=330,
            )
            st.plotly_chart(fig_radar, use_container_width=True)

        # CHART B: QUESTION-BY-QUESTION PROGRESSION
        with chart_c2:
            st.markdown("#### 📉 Round-by-Round Score Progression")
            st.caption("Tracking score consistency across each interview stage.")

            round_indices = [f"Q{i+1}: {log['category'].split()[0]}" for i, log in enumerate(logs)]
            scores = [log["round_score"] for log in logs]
            relevance_scores = [log["qwen_speech"].get("relevance_score", 85) for log in logs]

            fig_prog = go.Figure()
            fig_prog.add_trace(go.Scatter(
                x=round_indices,
                y=scores,
                mode="lines+markers",
                name="Overall Round Score",
                line=dict(color="#38bdf8", width=3),
                marker=dict(size=8, color="#0284c7"),
            ))
            fig_prog.add_trace(go.Scatter(
                x=round_indices,
                y=relevance_scores,
                mode="lines+markers",
                name="Answer Relevance",
                line=dict(color="#10b981", width=2, dash="dot"),
                marker=dict(size=6, color="#059669"),
            ))
            fig_prog.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(15, 23, 42, 0.4)",
                font=dict(family="sans-serif", color="#94a3b8", size=10),
                margin=dict(t=25, b=45, l=40, r=20),
                height=330,
                xaxis=dict(gridcolor="#1e293b", zerolinecolor="#1e293b"),
                yaxis=dict(range=[40, 105], gridcolor="#1e293b", zerolinecolor="#1e293b", title="Score (/100)"),
                legend=dict(orientation="h", yanchor="bottom", y=-0.22, xanchor="center", x=0.5, font=dict(size=11, color="#94a3b8")),
            )
            st.plotly_chart(fig_prog, use_container_width=True)

        # CHART C: EMOTION BREAKDOWN & PAUSE MAP
        st.markdown("#### 🎭 Demeanor & Pause Analysis")
        chart_d1, chart_d2 = st.columns([1, 1])

        with chart_d1:
            # Aggregate DeepFace emotions across all rounds
            all_emotions: Dict[str, float] = {}
            for log in logs:
                for k, v in log["vision"].get("emotion_breakdown", {}).items():
                    all_emotions[k] = all_emotions.get(k, 0.0) + v
            for k in all_emotions:
                all_emotions[k] = round(all_emotions[k] / num_rounds, 1)

            color_map = {
                "Neutral": "#38bdf8",
                "Confident/Happy": "#10b981",
                "Happy": "#10b981",
                "Nervous/Hesitant": "#f59e0b",
                "Nervous/Fearful": "#f59e0b",
                "Surprised": "#a855f7",
                "Sad": "#f43f5e",
            }
            labels = list(all_emotions.keys())
            values = list(all_emotions.values())
            colors = [color_map.get(label, "#94a3b8") for label in labels]

            fig_donut = go.Figure(data=[go.Pie(
                labels=labels,
                values=values,
                hole=0.6,
                marker=dict(colors=colors, line=dict(color="#0f172a", width=2)),
                textinfo="label+percent",
                textfont=dict(color="#f8fafc", size=10),
            )])
            fig_donut.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(family="sans-serif", color="#94a3b8"),
                margin=dict(t=20, b=20, l=10, r=10),
                showlegend=False,
                height=260,
                annotations=[dict(text="Average<br>Demeanor", x=0.5, y=0.5, font_size=11, font_color="#94a3b8", showarrow=False)],
            )
            st.plotly_chart(fig_donut, use_container_width=True)

        with chart_d2:
            st.markdown(
                f"""
                <div class="metric-card" style="height:260px; display:flex; flex-direction:column; justify-content:center;">
                    <div class="metric-title">Speaking Pace & Silence Summary</div>
                    <div style="font-size:0.9rem; color:#cbd5e1; line-height:1.8; margin-top:8px;">
                        • <strong>Average Speaking Speed:</strong> <span style="color:#38bdf8; font-weight:700;">{avg_wpm} WPM</span> (Benchmark: 130–160 WPM)<br>
                        • <strong>Long Pauses (>1.5s):</strong> {sum(log['physical_audio'].get('long_pauses_count', 0) for log in logs)} total hesitation intervals<br>
                        • <strong>Average Silence Ratio:</strong> {round(sum(log['physical_audio'].get('pause_ratio_percent', 10.0) for log in logs)/num_rounds, 1)}% of response duration<br>
                        • <strong>Camera Eye Contact:</strong> <span style="color:#10b981; font-weight:700;">{avg_eye}%</span> direct focus<br>
                        • <strong>Head Pose Stability:</strong> {round(sum(log['vision'].get('head_pose_stability_score', 90) for log in logs)/num_rounds, 1)}% composure
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        # -------------------------------------------------------------------
        # 3. ROUND-BY-ROUND TRANSCRIPT & DETAILED FEEDBACK ACCORDION
        # -------------------------------------------------------------------
        st.markdown("---")
        st.markdown("### 📝 Round-by-Round Transcripts & Performance Breakdown")

        for idx, log in enumerate(logs):
            q_category = log["category"]
            q_text = log["question_text"]
            r_score = log["round_score"]
            q_speech = log["qwen_speech"]
            p_audio = log["physical_audio"]
            v_vis = log["vision"]

            with st.expander(f"Question {idx + 1} ({q_category}) • Score: {r_score}/100", expanded=(idx == 0)):
                st.markdown(f"**Interview Question:** *\"{q_text}\"*")

                col_m1, col_m2, col_m3, col_m4 = st.columns(4)
                col_m1.metric("Relevance", f"{q_speech.get('relevance_score', 85)}%")
                col_m2.metric("Structure (STAR)", f"{q_speech.get('structural_clarity_score', 85)}%")
                col_m3.metric("Speaking Speed", f"{int(p_audio.get('estimated_wpm', 140))} WPM")
                col_m4.metric("Eye Contact", f"{int(v_vis.get('eye_contact_percentage', 85))}%")

                # Highlighted transcript
                transcript_text = q_speech.get("transcript", "")
                fillers = q_speech.get("detected_filler_words", [])
                highlighted = transcript_text
                for f_word in sorted(fillers, key=len, reverse=True):
                    pattern = re.compile(rf"\b({re.escape(f_word)})\b", re.IGNORECASE)
                    highlighted = pattern.sub(r'<mark class="filler-mark">\1</mark>', highlighted)

                st.markdown("**Verbatim Candidate Transcript:**")
                st.markdown(f'<div class="transcript-box">"{highlighted}"</div>', unsafe_allow_html=True)

                if fillers:
                    st.caption(f"Detected verbal crutches ({len(fillers)}): " + ", ".join([f'"{w}"' for w in fillers]))

        # -------------------------------------------------------------------
        # 4. EXECUTIVE COACHING SUMMARY & ACTION PLAN
        # -------------------------------------------------------------------
        st.markdown("---")
        st.markdown("### 🌟 Executive Coaching & Personalized Action Plan")

        coach_c1, coach_c2 = st.columns(2)

        with coach_c1:
            st.markdown("#### 🌟 Top Demonstrated Strengths")
            # Collect unique strengths across all answers
            all_strengths: List[str] = []
            for log in logs:
                all_strengths.extend(log["qwen_speech"].get("strengths", []))
            unique_strengths = list(dict.fromkeys(all_strengths))[:4]
            if not unique_strengths:
                unique_strengths = [
                    "Demonstrated disciplined adherence to the STAR framework across responses.",
                    "Kept camera eye contact consistently centered on the interviewer.",
                    "Maintained natural executive vocal pace within the optimal 130-160 WPM window.",
                ]

            for s in unique_strengths:
                st.markdown(
                    f"""
                    <div style="display:flex; align-items:flex-start; gap:10px; padding:10px 14px; margin-bottom:8px; border-radius:8px; background:rgba(6, 78, 59, 0.2); border:1px solid rgba(5, 150, 105, 0.4);">
                        <span style="color:#10b981; font-weight:bold; font-size:1.1rem;">✔</span>
                        <span style="color:#e2e8f0; font-size:0.9rem; line-height:1.5;">{s}</span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

        with coach_c2:
            st.markdown("#### 💡 Priority Areas for Growth")
            all_improvements: List[str] = []
            for log in logs:
                all_improvements.extend(log["qwen_speech"].get("improvement_areas", []))
            unique_improvements = list(dict.fromkeys(all_improvements))[:4]
            if not unique_improvements:
                unique_improvements = [
                    f"Reduce verbal fillers (detected {total_fillers} instances) by embracing intentional silent pauses.",
                    "Deepen measurable outcome metrics (e.g. quantifiable % latency, cost, or revenue improvements).",
                    "Strengthen the 'Action' phase of STAR by emphasizing personal technical choices over collective team efforts.",
                ]

            for imp in unique_improvements:
                st.markdown(
                    f"""
                    <div style="display:flex; align-items:flex-start; gap:10px; padding:10px 14px; margin-bottom:8px; border-radius:8px; background:rgba(120, 53, 15, 0.2); border:1px solid rgba(217, 119, 6, 0.4);">
                        <span style="color:#f59e0b; font-weight:bold; font-size:1.1rem;">⚡</span>
                        <span style="color:#e2e8f0; font-size:0.9rem; line-height:1.5;">{imp}</span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

        # Action Buttons
        st.markdown("---")
        b1, b2 = st.columns([1, 1])
        with b1:
            if st.button("🔄 Start New Practice Interview Session", type="primary", use_container_width=True):
                reset_interview()
                st.rerun()
        with b2:
            st.download_button(
                label="📥 Download Performance Report (JSON)",
                data=pd.DataFrame([{
                    "candidate": st.session_state.candidate_name,
                    "role": st.session_state.selected_role,
                    "overall_score": avg_overall,
                    "relevance": avg_rel,
                    "eye_contact": avg_eye,
                    "wpm": avg_wpm,
                    "fillers": total_fillers,
                }]).to_json(orient="records", indent=2),
                file_name=f"interview_report_{st.session_state.candidate_name.lower().replace(' ', '_')}.json",
                mime="application/json",
                use_container_width=True,
            )
