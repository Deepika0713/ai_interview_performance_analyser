"""
=============================================================================
 AI Interview Performance Analyzer - Text-to-Speech Engine
=============================================================================
Provides multi-tier Text-to-Speech generation:
1. gTTS (Google Text-to-Speech) for realistic voice synthesis.
2. pyttsx3 offline fallback when installed.
3. Pure Python synthesized prompt chime (wave + struct) ensuring 100% reliability.
4. Auto-playing HTML5 audio element (base64) + Browser Web Speech API fallback.
=============================================================================
"""

import os
import math
import wave
import struct
import base64
from typing import Optional


def synthesize_fallback_chime(output_path: str, duration_sec: float = 1.2, sample_rate: int = 22050):
    """
    Synthesizes a pleasant dual-tone chime audio file using pure Python
    standard library (wave + struct), guaranteeing audio playback even with no external TTS packages.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    num_samples = int(duration_sec * sample_rate)
    freq1, freq2 = 523.25, 659.25  # C5 and E5 harmonious chord

    with wave.open(output_path, "w") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)

        for i in range(num_samples):
            t = float(i) / sample_rate
            envelope = math.exp(-2.5 * t)  # Gentle decay
            val = (
                0.5 * math.sin(2.0 * math.pi * freq1 * t)
                + 0.5 * math.sin(2.0 * math.pi * freq2 * t)
            ) * envelope
            sample = int(val * 24000.0)
            sample = max(-32767, min(32767, sample))
            wav_file.writeframes(struct.pack("<h", sample))


def generate_tts_audio(text: str, output_path: str) -> bool:
    """
    Generates spoken audio for an interview question.
    Tries gTTS first, then pyttsx3, then falls back to synthesized harmonic chime.
    Returns True if voice synthesis succeeded, False if harmonic fallback was used.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # 1. Try gTTS (Google Text-to-Speech)
    try:
        from gtts import gTTS
        # Clean text of markdown asterisks or special formatting
        clean_text = text.replace("*", "").replace("`", "").strip()
        tts = gTTS(text=clean_text, lang="en", tld="com", slow=False)
        tts.save(output_path)
        return True
    except Exception:
        pass

    # 2. Try pyttsx3
    try:
        import pyttsx3
        clean_text = text.replace("*", "").replace("`", "").strip()
        engine = pyttsx3.init()
        engine.setProperty("rate", 160)
        engine.save_to_file(clean_text, output_path)
        engine.runAndWait()
        return True
    except Exception:
        pass

    # 3. Graceful fallback: Pure Python WAV chime
    fallback_wav_path = output_path if output_path.endswith(".wav") else output_path.replace(".mp3", ".wav")
    synthesize_fallback_chime(fallback_wav_path)
    return False


def get_auto_play_audio_html(audio_path: str, text: str, auto_play: bool = True) -> str:
    """
    Generates an HTML5 audio element with base64 data URI and browser Web Speech API fallback.
    Ensures that when Question N is displayed, the candidate hears the interviewer speak aloud
    immediately upon turn start without requiring any user click.
    """
    clean_text = (
        text.replace('"', '\\"')
        .replace("\n", " ")
        .replace("'", "\\'")
        .replace("*", "")
    )
    elem_id = f"speech_btn_{abs(hash(text)) % 100000}"
    audio_id = f"auto_audio_{abs(hash(text)) % 100000}"

    # Read audio bytes for base64 embed
    b64_audio = ""
    mime_type = "audio/wav"
    if os.path.exists(audio_path):
        try:
            with open(audio_path, "rb") as f:
                b64_audio = base64.b64encode(f.read()).decode("utf-8")
            if audio_path.lower().endswith(".mp3"):
                mime_type = "audio/mp3"
        except Exception:
            pass

    audio_tag = ""
    if b64_audio:
        audio_tag = f"""
        <audio id="{audio_id}" {'autoplay' if auto_play else ''} playsinline style="display:none;">
            <source src="data:{mime_type};base64,{b64_audio}" type="{mime_type}">
        </audio>
        """

    html = f"""
    <div style="margin: 8px 0;">
        {audio_tag}
        <button id="{elem_id}" style="
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff;
            border: 1px solid #3b82f6;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(37,99,235,0.3);
            transition: all 0.2s ease;
        ">
            <span>🔊 Speak Question Aloud</span>
        </button>
        <span id="{elem_id}_status" style="font-size:0.75rem; color:#94a3b8; margin-left:10px;"></span>
    </div>
    <script>
        (function() {{
            const textToSpeak = "{clean_text}";
            const btn = document.getElementById("{elem_id}");
            const status = document.getElementById("{elem_id}_status");
            const audioEl = document.getElementById("{audio_id}");
            let hasPlayed = false;

            function fallbackSpeak() {{
                if (!('speechSynthesis' in window)) {{
                    if (status) status.innerText = "Audio ready";
                    return;
                }}
                window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(textToSpeak);
                utter.rate = 1.0;
                utter.pitch = 1.0;
                const voices = window.speechSynthesis.getVoices();
                const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
                if (engVoice) utter.voice = engVoice;

                utter.onstart = () => {{
                    if (status) status.innerText = "Interviewer speaking...";
                    btn.style.borderColor = "#10b981";
                }};
                utter.onend = () => {{
                    if (status) status.innerText = "";
                    btn.style.borderColor = "#3b82f6";
                }};
                window.speechSynthesis.speak(utter);
            }}

            function playAudio() {{
                if (audioEl) {{
                    audioEl.currentTime = 0;
                    audioEl.play().then(() => {{
                        if (status) status.innerText = "Interviewer speaking...";
                        audioEl.onended = () => {{
                            if (status) status.innerText = "";
                        }};
                    }}).catch(err => {{
                        fallbackSpeak();
                    }});
                }} else {{
                    fallbackSpeak();
                }}
            }}

            btn.onclick = playAudio;

            {'if (!hasPlayed) { hasPlayed = true; setTimeout(playAudio, 300); }' if auto_play else ''}
        }})();
    </script>
    """
    return html


def get_browser_speech_html(text: str, auto_play: bool = True) -> str:
    """
    Backward-compatible browser-side Web Speech API JavaScript snippet.
    """
    clean_text = (
        text.replace('"', '\\"')
        .replace("\n", " ")
        .replace("'", "\\'")
        .replace("*", "")
    )
    elem_id = f"speech_btn_{abs(hash(text)) % 100000}"

    html = f"""
    <div style="margin: 8px 0;">
        <button id="{elem_id}" style="
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff;
            border: 1px solid #3b82f6;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(37,99,235,0.3);
            transition: all 0.2s ease;
        ">
            <span>🔊 Speak Question Aloud</span>
        </button>
        <span id="{elem_id}_status" style="font-size:0.75rem; color:#94a3b8; margin-left:10px;"></span>
    </div>
    <script>
        (function() {{
            const textToSpeak = "{clean_text}";
            const btn = document.getElementById("{elem_id}");
            const status = document.getElementById("{elem_id}_status");

            function speak() {{
                if (!('speechSynthesis' in window)) {{
                    status.innerText = "Browser TTS not supported";
                    return;
                }}
                window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(textToSpeak);
                utter.rate = 1.0;
                utter.pitch = 1.0;
                
                const voices = window.speechSynthesis.getVoices();
                const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
                if (englishVoice) {{
                    utter.voice = englishVoice;
                }}

                utter.onstart = () => {{
                    status.innerText = "Speaking...";
                    btn.style.borderColor = "#10b981";
                }};
                utter.onend = () => {{
                    status.innerText = "";
                    btn.style.borderColor = "#3b82f6";
                }};
                window.speechSynthesis.speak(utter);
            }}

            btn.onclick = speak;

            {'setTimeout(speak, 500);' if auto_play else ''}
        }})();
    </script>
    """
    return html
