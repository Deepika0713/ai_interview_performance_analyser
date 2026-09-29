"""
Re-export from root audio_processor for modular package imports.
"""
from audio_processor import analyze_physical_audio, analyze_speech_multimodal

__all__ = ["analyze_physical_audio", "analyze_speech_multimodal"]
