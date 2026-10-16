#!/usr/bin/env python3
"""
Pre-generate studio-quality audio files for all 30 English topics using Kokoro TTS
Converts to optimized 96k MP3 files for instant zero-latency playback.
"""

import os
import re
import json
import time
import urllib.request
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
AUDIO_DIR = BASE_DIR / "audio"
TOPICS_FILE = BASE_DIR / "topics-data.js"
KOKORO_URL = "http://localhost:8880/v1/audio/speech"
VOICE = "af_heart"  # High quality, clear, natural American female voice

def load_topics():
    with open(TOPICS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    # Extract JSON array
    match = re.search(r"const\s+TOPICS_DATA\s*=\s*(\[[\s\S]*\]);", content)
    if not match:
        raise ValueError("Could not find TOPICS_DATA array in topics-data.js")
    return json.loads(match.group(1))

def generate_topic_audio(topic):
    topic_id = topic["id"]
    output_mp3 = AUDIO_DIR / f"topic-{topic_id}.mp3"
    temp_wav = AUDIO_DIR / f"temp-{topic_id}.wav"

    if output_mp3.exists() and output_mp3.stat().st_size > 10000:
        print(f"[{topic_id}/30] Already exists ({output_mp3.stat().st_size // 1024} KB). Skipping.")
        return

    text = topic["fullSpeech"].strip()
    words = len(text.split())
    print(f"[{topic_id}/30] Generating Kokoro audio ({words} words): {topic['title'][:40]}...", flush=True)

    t0 = time.time()
    payload = json.dumps({
        "input": text,
        "voice": VOICE,
        "speed": 1.0,
        "lang": "en"
    }).encode("utf-8")

    req = urllib.request.Request(
        KOKORO_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    with urllib.request.urlopen(req, timeout=120) as resp:
        wav_data = resp.read()

    with open(temp_wav, "wb") as f:
        f.write(wav_data)

    # Convert WAV to compact 96k MP3
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", str(temp_wav),
        "-codec:a", "libmp3lame",
        "-b:a", "96k",
        str(output_mp3)
    ]
    subprocess.run(cmd, check=True)

    if temp_wav.exists():
        temp_wav.unlink()

    duration = time.time() - t0
    size_kb = output_mp3.stat().st_size // 1024
    print(f" -> Done in {duration:.1f}s: {size_kb} KB ({output_mp3.name})", flush=True)

def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    topics = load_topics()
    print(f"Found {len(topics)} topics to process.")
    start_all = time.time()

    for topic in topics:
        try:
            generate_topic_audio(topic)
        except Exception as e:
            print(f"Error on topic {topic.get('id')}: {e}", flush=True)

    total_time = time.time() - start_all
    print(f"\nAll topics processed in {total_time:.1f}s!")

if __name__ == "__main__":
    main()
