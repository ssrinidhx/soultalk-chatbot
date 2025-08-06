// src/components/Topbar.js
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Topbar = ({ user, onLogout }) => {
  const [dropdown, setDropdown] = useState(false);

  const toggleDropdown = () => setDropdown(!dropdown);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '10px 20px',
      background: '#f8f9fa',
      borderBottom: '1px solid #ddd'
    }}>
      <div style={{ position: 'relative' }}>
        <img
          src={user.photoURL}
          alt="Profile"
          width={40}
          style={{ borderRadius: '50%', cursor: 'pointer' }}
          onClick={toggleDropdown}
        />
        {dropdown && (
          <div style={{
            position: 'absolute',
            top: '50px',
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '5px',
            padding: '10px',
            textAlign: 'right',
            minWidth: '150px',
            zIndex: 1000
          }}>
            <div><strong>{user.displayName}</strong></div>
            <div style={{ fontSize: '0.85em', color: '#555' }}>{user.email}</div>
            <hr />
            <button onClick={handleLogout} style={{
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%'
            }}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
