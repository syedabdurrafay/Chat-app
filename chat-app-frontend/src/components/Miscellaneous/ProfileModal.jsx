import { useState } from 'react'
import './ProfileModal.css'

const ProfileModal = ({ user, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {children ? (
        <span onClick={() => setIsOpen(true)}>{children}</span>
      ) : (
        <button 
          className="profile-modal-trigger"
          onClick={() => setIsOpen(true)}
        >
          View Profile
        </button>
      )}

      {isOpen && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content">
            <button
              className="profile-modal-close"
              onClick={() => setIsOpen(false)}
            >
              &times;
            </button>
            
            <div className="profile-modal-header">
              <img
                className="profile-modal-avatar"
                src={user.pic}
                alt={user.name}
              />
              <h2 className="profile-modal-title">{user.name}</h2>
            </div>
            
            <div className="profile-modal-body">
              <div className="profile-info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user.email}</span>
              </div>
              
              {/* Additional profile info can be added here */}
              
              <button
                className="profile-modal-button"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProfileModal