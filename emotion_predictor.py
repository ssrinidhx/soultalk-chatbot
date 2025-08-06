import opensmile
import joblib
import numpy as np
import os

# Initialize OpenSMILE
smile = opensmile.Smile(
    feature_set=opensmile.FeatureSet.eGeMAPSv02,
    feature_level=opensmile.FeatureLevel.Functionals
)

# Load the trained model
model_path = "emotion_audio_model.pkl"

if not os.path.exists(model_path):
    raise FileNotFoundError(f"Trained model not found at {model_path}")

model = joblib.load(model_path)

def predict_emotion_from_audio(file_path):
    try:
        features = smile.process_file(file_path)
        prediction = model.predict(features)[0]
        return prediction.upper()
    except Exception as e:
        print(f"❌ Error in predicting emotion: {e}")
        return "UNKNOWN"
