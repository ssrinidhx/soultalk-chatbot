import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatBox = ({ user, sessionId }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [refreshSidebar, setRefreshSidebar] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef(null);
  const chatRef = useRef(null);
  const utteranceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.post('http://localhost:5000/api/session/messages', {
          sessionId,
        });
        const msgs = res.data.messages || [];
        const formatted = msgs.map((msg) => [
          { sender: 'user', text: msg.user_message },
          { sender: 'bot', text: msg.bot_reply }
        ]).flat();
        setMessages(formatted);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    setMessages([]);
    fetchMessages();
  }, [sessionId]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const res = await axios.post('http://localhost:5000/api/message', {
        message: currentInput,
        email: user.email,
        sessionId,
      });

      const botMsg = { sender: 'bot', text: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
      speakText(res.data.reply);

      if (res.data.sessionTitleUpdated) {
        setRefreshSidebar(prev => !prev);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const speakText = (text) => {
    window.speechSynthesis.cancel();

    const cleanedText = text.replace(
      /[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ''
    );

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onpause = () => setPaused(true);
    utterance.onresume = () => setPaused(false);
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const toggleVoice = () => {
    if (!utteranceRef.current) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input not supported on this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setInput('');

      try {
        const userMsg = { sender: 'user', text: transcript };
        setMessages((prev) => [...prev, userMsg]);

        const res = await axios.post('http://localhost:5000/api/message', {
          message: transcript,
          email: user.email,
          sessionId,
        });

        const botMsg = { sender: 'bot', text: res.data.reply };
        setMessages((prev) => [...prev, botMsg]);
        speakText(res.data.reply);

        if (res.data.sessionTitleUpdated) {
          setRefreshSidebar(prev => !prev);
        }
      } catch (err) {
        console.error('Voice input error:', err);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };

    recognition.start();
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("🎙️ Microphone not supported.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'tone.wav');
        formData.append('email', user.email);
        formData.append('sessionId', sessionId);

        const userMsg = { sender: 'user', text: "🎤 Voice tone message" };
        setMessages((prev) => [...prev, userMsg]);

        try {
          const res = await axios.post('http://localhost:5000/api/voice-message', formData);
          const botMsg = { sender: 'bot', text: res.data.reply };
          setMessages((prev) => [...prev, botMsg]);
          speakText(res.data.reply);
        } catch (err) {
          console.error("Error sending voice tone:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };
  const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};


  return (
    <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Calibri' }}>
      <div
        ref={chatRef}
        style={{
          height: '500px',
          border: '1px solid #ccc',
          padding: '10px',
          overflowY: 'auto',
          borderRadius: '10px',
          background: '#f9f9f9',
          marginBottom: '10px',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                backgroundColor: msg.sender === 'user' ? '#d0e7ff' : '#d4edda',
                color: '#000',
                padding: '10px 15px',
                borderRadius: '18px',
                maxWidth: '80%',
                whiteSpace: 'pre-wrap',
                fontSize: '15px',
                lineHeight: '1.4',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <strong style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: msg.sender === 'user' ? '#0b5ed7' : '#198754' }}>
                {msg.sender === 'user' ? 'You' : 'SoulTalk'}
              </strong>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <input
          type="text"
          placeholder="Say something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontFamily: 'Calibri',
          }}
        />
        <button onClick={sendMessage}>Send</button>
        <button onClick={handleVoiceInput}>🎙️ Text Voice</button>
        <button onClick={toggleVoice}>{paused ? '▶️' : '⏸️'}</button>
        <button onClick={() => window.speechSynthesis.cancel()}>🔇</button>
      </div>
    </div>
  );
};

export default ChatBox;
