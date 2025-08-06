import os
import shutil

# RAVDESS source directory
source_dir = 'ravdess'
target_dir = 'data'  # where files will be organized

# RAVDESS emotion codes
emotion_map = {
    '01': 'neutral',
    '02': 'calm',      # optional
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '06': 'fearful',   # optional
    '07': 'disgust',   # optional
    '08': 'surprised'  # optional
}

os.makedirs(target_dir, exist_ok=True)

for emotion in emotion_map.values():
    os.makedirs(os.path.join(target_dir, emotion), exist_ok=True)

for actor_folder in os.listdir(source_dir):
    actor_path = os.path.join(source_dir, actor_folder)
    for file in os.listdir(actor_path):
        emotion_code = file.split('-')[2]
        emotion = emotion_map.get(emotion_code)
        if emotion:
            src = os.path.join(actor_path, file)
            dest = os.path.join(target_dir, emotion, file)
            shutil.copy(src, dest)

print("✅ Files organized by emotion in 'data/' folder.")
