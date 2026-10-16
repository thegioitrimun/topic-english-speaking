# -*- coding: utf-8 -*-
import json
from gen_topics_1_10 import topics_1_10
from gen_topics_11_20 import topics_11_20
from gen_topics_21_30 import topics_21_30

all_topics = topics_1_10 + topics_11_20 + topics_21_30

print(f"Total topics combined: {len(all_topics)}")

# Validate all topics have required keys and are 1 to 30
assert len(all_topics) == 30, f"Expected 30 topics, got {len(all_topics)}"
for i, t in enumerate(all_topics, 1):
    assert t["id"] == i, f"Topic id mismatch at index {i}: got {t['id']}"
    assert "title" in t and "titleVi" in t and "outline" in t and "fullSpeech" in t and "speechVi" in t
    assert "vocabulary" in t and len(t["vocabulary"]) >= 4

# Write to topics-data.js
js_content = "// 30 English Public Speaking Topics - Tra Vinh University (TVU) Course\n"
js_content += "// Foundation of Public Speaking (Hùng biện Tiếng Anh cơ bản)\n\n"
js_content += "const TOPICS_DATA = " + json.dumps(all_topics, ensure_ascii=False, indent=2) + ";\n"

with open("topics-data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Successfully wrote topics-data.js!")
