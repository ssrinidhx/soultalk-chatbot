import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Sidebar = ({ user, onSelectSession, currentSessionId, onNewChat, refreshTrigger }) => {
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/session/list', {
        email: user.email
      });
      setSessions(res.data.sessions);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchSessions();
    }
  }, [user, refreshTrigger]); // Refresh when new chat or title changes

  return (
    <div style={{
      width: "250px",
      height: "100vh",
      background: "#f4f4f4",
      padding: "10px",
      borderRight: "1px solid #ccc",
      overflowY: "auto"
    }}>
      <button
        onClick={onNewChat}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          marginBottom: "15px",
          cursor: "pointer",
          transition: "0.2s ease-in-out"
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0056b3"}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#007bff"}
      >
        ➕ New Chat
      </button>

      {sessions.map((session) => (
        <div
          key={session.sessionId}
          onClick={() => onSelectSession(session.sessionId)}
          style={{
            padding: "10px",
            marginBottom: "8px",
            backgroundColor: currentSessionId === session.sessionId ? "#d0ebff" : "#fff",
            borderRadius: "5px",
            cursor: "pointer",
            border: "1px solid #ddd"
          }}
        >
          {session.title ? session.title.toUpperCase() : "NEW CHAT"}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
