#!/usr/bin/env python3
"""
Generate phonetics-data.js containing IPA phonetics and meanings
for all words appearing in the 30 English topics and outlines.
"""

import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
TOPICS_FILE = BASE_DIR / "topics-data.js"
OUTPUT_FILE = BASE_DIR / "phonetics-data.js"

def main():
    with open(TOPICS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.search(r"const\s+TOPICS_DATA\s*=\s*(\[[\s\S]*\]);", content)
    if not match:
        raise ValueError("Cannot parse TOPICS_DATA")
    topics = json.loads(match.group(1))

    # 1. Collect all known vocabularies with phonetics & meanings
    vocab_map = {}
    for t in topics:
        for v in t.get("vocabulary", []):
            w = v["word"].strip().lower()
            vocab_map[w] = {
                "ipa": v.get("phonetics", "").strip(),
                "meaning": v.get("meaning", "").strip(),
                "topic": t["id"]
            }

    # 2. Extract all unique words across speeches, outlines, and vocab
    all_words = set()
    for t in topics:
        speech = t.get("fullSpeech", "")
        outline_json = json.dumps(t.get("outline", {}), ensure_ascii=False)
        for token in re.findall(r"[a-zA-Z]+(?:-[a-zA-Z]+)?", speech + " " + outline_json):
            if len(token) > 1:
                all_words.add(token.lower())

    # 3. Generate phonetics using kokoro_onnx Tokenizer
    from kokoro_onnx.tokenizer import Tokenizer
    tokenizer = Tokenizer()

    phonetics_dict = {}

    # First priority: custom vocabulary
    for w, item in vocab_map.items():
        phonetics_dict[w] = item

    # Second priority: words from speeches
    for w in sorted(all_words):
        if w not in phonetics_dict:
            try:
                ipa = tokenizer.phonemize(w, "en-us")
                if ipa:
                    phonetics_dict[w] = {"ipa": f"/{ipa}/"}
            except Exception:
                pass

    print(f"Generated phonetics for {len(phonetics_dict)} words.")

    # Write to phonetics-data.js
    js_content = f"""// 30 English Topics - Phonetics & Vocabulary Lexicon
// Generated with Kokoro ONNX IPA Phonemizer
// Provides offline instant IPA phonetics and Vietnamese meanings for all topic words

const PHONETICS_DATA = {json.dumps(phonetics_dict, ensure_ascii=False, indent=2)};
"""
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"Saved to {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size // 1024} KB).")

if __name__ == "__main__":
    main()
