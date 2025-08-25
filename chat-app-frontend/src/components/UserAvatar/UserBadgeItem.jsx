import React from 'react';
import './UserBadgeItem.css';

const UserBadgeItem = ({ user, handleFunction, admin }) => {
  return (
    <div className="quantum-badge" onClick={handleFunction}>
      <span className="hologram-effect"></span>
      <span className="user-name">
        {user.name}
        {admin === user._id && (
          <span className="admin-label">
            <span className="neural-pulse"></span>Admin
          </span>
        )}
      </span>
      <span className="close-icon">⚡</span>
      <span className="particle-trail"></span>
    </div>
  );
};

export default UserBadgeItem;