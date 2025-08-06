// src/App.js
import React, { useState, useEffect } from 'react';
import GoogleLoginButton from './components/GoogleLoginButton';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import ChatBox from './components/ChatBox';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // You’ll create this for custom styles

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setCurrentSessionId(null);
  };

  const handleNewChat = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/session/new', {
        email: user.email,
      });
      setCurrentSessionId(res.data.sessionId);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Error creating session:", err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 loading-screen">
        <h2>Loading SoulTalk...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="unauthenticated-view">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
          <div className="container">
            <a className="navbar-brand fw-bold text-muted fs-4" href="#">SoulTalk 💬</a>
            <div className="ms-auto">
              <GoogleLoginButton onLogin={setUser} />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero-section text-center">
          <div className="container">
            <h1 className="display-5 fw-bold">Speak. Feel. Heal.</h1>
            <p className="lead mt-3">Your soft-spoken AI companion who truly listens 🌸</p>
            <a href="#features" className="btn btn-outline-dark btn-lg mt-4">Explore Features ↓</a>
          </div>
        </section>

        {/* About */}
        <section className="bg-white py-5" id="about">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h2 className="text-muted">What is SoulTalk?</h2>
                <p className="lead">A safe space built with AI to help you talk out your feelings. Whether it’s a word or a whisper, SoulTalk responds with heart 💜</p>
              </div>
              <div className="col-md-6 text-center">
                <img src="https://cdn-icons-png.flaticon.com/512/4712/4712070.png" alt="SoulTalk AI" className="img-fluid rounded" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-light-subtle py-5" id="features">
          <div className="container text-center">
            <h2 className="mb-5 text-muted fw-semibold">Why SoulTalk?</h2>
            <div className="row g-4">
              {[
                { title: "💬 Voice & Text Chat", desc: "Speak freely – SoulTalk understands both voice and text." },
                { title: "💖 Emotion Detection", desc: "We get how you feel, not just what you say." },
                { title: "🎯 Context Aware", desc: "Continuity matters – every chat picks up where you left off." },
              ].map((feat, i) => (
                <div className="col-md-4" key={i}>
                  <div className="card border-0 shadow-sm h-100 custom-card">
                    <div className="card-body">
                      <h5 className="card-title text-muted">{feat.title}</h5>
                      <p className="card-text text-secondary">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer-section text-muted text-center py-3 mt-4">
          <p className="mb-0 small">© {new Date().getFullYear()} SoulTalk | Created with 💫</p>
        </footer>
      </div>
    );
  }

  // After login
  return (
    <div className="app-container">
      <Sidebar
        user={user}
        onSelectSession={setCurrentSessionId}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        refreshTrigger={refreshKey}
      />
      <div className="main-content">
        <Topbar user={user} onLogout={handleLogout} />
        <div className="chat-area">
          {currentSessionId ? (
            <ChatBox user={user} sessionId={currentSessionId} />
          ) : (
            <div className="start-chat-placeholder">
              👈 Select a chat or click <strong>New Chat</strong> to begin!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
