import os
import pandas as pd
import opensmile
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Path to pre-organized emotion folders
DATASET_DIR = 'data'

# Emotion to label
emotion_labels = {
    'happy': 0,
    'sad': 1,
    'angry': 2,
    'neutral': 3
}

# OpenSMILE config
smile = opensmile.Smile(
    feature_set=opensmile.FeatureSet.eGeMAPSv02,
    feature_level=opensmile.FeatureLevel.Functionals
)

X, y = [], []

print("🔍 Extracting audio features...")

for emotion, label in emotion_labels.items():
    folder = os.path.join(DATASET_DIR, emotion)
    if not os.path.isdir(folder):
        continue
    for filename in os.listdir(folder):
        if filename.endswith(".wav"):
            path = os.path.join(folder, filename)
            try:
                features = smile.process_file(path)
                X.append(features.iloc[0])
                y.append(label)
            except Exception as e:
                print(f"❌ Error processing {filename}: {e}")

# Convert to DataFrame
df = pd.DataFrame(X)
df['label'] = y

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(
    df.drop(columns=['label']),
    df['label'],
    test_size=0.2,
    random_state=42
)

# Train classifier
print("🧠 Training model...")
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Evaluation
print("📊 Evaluation Results:")
print(classification_report(y_test, clf.predict(X_test)))

# Save model
joblib.dump(clf, "emotion_audio_model.pkl")
print("✅ Model saved as emotion_audio_model.pkl")
