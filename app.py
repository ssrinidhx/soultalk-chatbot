from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from transformers import pipeline
from dotenv import load_dotenv
import cohere
import os
import uuid
import librosa
import soundfile as sf
import joblib
import tempfile
import opensmile
from emotion_predictor import predict_emotion_from_audio
import io

load_dotenv()
cohere_api_key = os.getenv("your_apikey")
mongo_uri = os.getenv("MONGO_URI")

app = Flask(__name__)
CORS(app)

client = MongoClient(mongo_uri)
db = client['soultalk']
sessions = db['sessions']
messages_collection = db['messages']

emotion_classifier = pipeline(
    "text-classification",
    model="bhadresh-savani/distilbert-base-uncased-emotion"
)

co = cohere.Client(cohere_api_key)

def generate_ai_reply(history, emotion):
    chat_log = "\n".join([f"User: {m['user_message']}\nSoulTalk: {m['bot_reply']}" for m in history[:-1]])
    latest_input = history[-1]['user_message']

    prompt = f"""
You are SoulTalk, an empathetic and supportive AI companion. The user is feeling {emotion.lower()}.

Your role is to gently respond based on the full conversation. Keep the tone supportive and friendly.

Instructions:
- Be concise (2-3 lines).
- Don't make the response very big, keep it crisp and concise.
- Use emojies if needed.
- Stay emotionally in tune with the user.
- Never repeat previous responses.
- Avoid generic filler like “I'm sorry you feel that way”.

Here is the chat history:
{chat_log}

User: {latest_input}
SoulTalk:"""

    response = co.chat(
        message=prompt.strip(),
        model="command-r",
        temperature=0.6,
    )
    return response.text.strip()

try:
    audio_emotion_model = joblib.load("emotion_audio_model.pkl")  
except Exception as e:
    print("❌ Failed to load audio emotion model:", str(e))
    audio_emotion_model = None

@app.route('/')
def home():
    return "💬 SoulTalk Backend (Context-Aware) is Running!"

@app.route('/api/session/new', methods=['POST'])
def create_session():
    data = request.get_json()
    user_email = data.get('email')

    if not user_email:
        return jsonify({'error': 'Missing email'}), 400

    session_id = str(uuid.uuid4())
    session_entry = {
        'sessionId': session_id,
        'email': user_email,
        'title': None,
        'emotion': None,
        'createdAt': datetime.now()
    }

    sessions.insert_one(session_entry)
    return jsonify({'sessionId': session_id})

@app.route('/api/session/list', methods=['POST'])
def get_sessions():
    data = request.get_json()
    user_email = data.get('email')

    if not user_email:
        return jsonify({'error': 'Missing email'}), 400

    session_list = list(sessions.find({'email': user_email}).sort('createdAt', -1))
    for s in session_list:
        s['_id'] = str(s['_id'])
        s['createdAt'] = s['createdAt'].strftime('%Y-%m-%d %H:%M:%S')
    return jsonify({'sessions': session_list})

@app.route('/api/session/messages', methods=['POST'])
def get_session_messages():
    data = request.get_json()
    session_id = data.get('sessionId')

    if not session_id:
        return jsonify({'error': 'Missing sessionId'}), 400

    msgs = list(messages_collection.find({'sessionId': session_id}).sort('timestamp', 1))
    for m in msgs:
        m['_id'] = str(m['_id'])
        m['timestamp'] = m['timestamp'].strftime('%Y-%m-%d %H:%M:%S')

    return jsonify({'messages': msgs})

@app.route('/api/message', methods=['POST'])
def handle_message():
    try:
        data = request.get_json()
        print("Received:", data)
        user_msg = data.get('message', '').strip()
        user_email = data.get('email')
        session_id = data.get('sessionId')

        if not user_msg or not user_email or not session_id:
            print("❌ Missing data")
            return jsonify({'error': 'Missing required data'}), 400

        session = sessions.find_one({'sessionId': session_id})
        if not session:
            print("❌ Invalid session")
            return jsonify({'error': 'Invalid session'}), 404

        emotion = session.get('emotion')
        title_changed = False

        if not emotion:
            print("🔍 Detecting emotion...")
            result = emotion_classifier(user_msg)[0]
            emotion = result['label'].upper()
            sessions.update_one({'sessionId': session_id}, {'$set': {'emotion': emotion, 'title': emotion}})
            title_changed = True

        print("✅ Emotion:", emotion)

        full_history = list(messages_collection.find(
            {'sessionId': session_id},
            {'_id': 0, 'user_message': 1, 'bot_reply': 1}
        ).sort('timestamp', 1))

        full_history.append({'user_message': user_msg, 'bot_reply': ''})
        reply = generate_ai_reply(full_history, emotion)

        print("🧠 AI reply generated:", reply)

        msg_doc = {
            'sessionId': session_id,
            'email': user_email,
            'user_message': user_msg,
            'emotion': emotion,
            'confidence': None,
            'bot_reply': reply,
            'timestamp': datetime.now()
        }
        messages_collection.insert_one(msg_doc)

        return jsonify({
            'reply': reply,
            'emotion': emotion,
            'titleChanged': title_changed
        })

    except Exception as e:
        print("❌ Error in /api/message:", str(e))
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/voice-message', methods=['POST'])
def handle_voice_message():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    user_email = request.form.get('email')
    session_id = request.form.get('sessionId')
    if not user_email or not session_id:
        return jsonify({'error': 'Missing email or sessionId'}), 400

    audio_file = request.files['audio']

    try:
        audio_bytes = audio_file.read()
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000, mono=True)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            audio_path = tmp.name
            sf.write(audio_path, y, sr)
        emotion = predict_emotion_from_audio(audio_path)
        session = sessions.find_one({'sessionId': session_id})
        if not session:
            return jsonify({'error': 'Invalid session'}), 404
        if not session.get('emotion'):
            sessions.update_one({'sessionId': session_id}, {'$set': {'emotion': emotion, 'title': emotion}})

        full_history = list(messages_collection.find(
            {'sessionId': session_id},
            {'_id': 0, 'user_message': 1, 'bot_reply': 1}
        ).sort('timestamp', 1))

        full_history.append({'user_message': "🎤 Voice message", 'bot_reply': ''})
        reply = generate_ai_reply(full_history, emotion)

        msg_doc = {
            'sessionId': session_id,
            'email': user_email,
            'user_message': "🎤 Voice message",
            'emotion': emotion,
            'confidence': None,
            'bot_reply': reply,
            'timestamp': datetime.now()
        }
        messages_collection.insert_one(msg_doc)

        return jsonify({
            'reply': reply,
            'emotion': emotion,
            'titleChanged': not session.get('emotion')
        })

    except Exception as e:
        print("❌ Voice message error:", str(e))
        return jsonify({'error': 'Failed to process voice message'}), 500

if __name__ == '__main__':
    app.run(debug=True)
