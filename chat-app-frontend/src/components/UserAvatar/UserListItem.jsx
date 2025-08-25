import React from 'react';
import { ChatState } from '../../context/ChatProvider';
import './UserListItem.css';

const UserListItem = ({ user, handleFunction }) => {
  return (
    <div className="neuro-list-item" onClick={handleFunction}>
      <div className="holographic-avatar">
        <img
          className="user-avatar"
          src={user.pic}
          alt={user.name}
        />
        <div className="avatar-glow"></div>
      </div>
      <div className="user-info">
        <p className="user-name">{user.name}</p>
        <p className="user-email">
          <span className="email-label">⚡ Neural Link:</span> {user.email}
        </p>
      </div>
      <div className="connection-visualization">
        <div className="neural-node"></div>
        <div className="neural-node"></div>
        <div className="neural-node"></div>
      </div>
      <div className="spectrum-border"></div>
    </div>
  );
};

export default UserListItem;