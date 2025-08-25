import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ChatLoading from '../Chat/ChatLoading'
import ProfileModal from './ProfileModal'
import { getSender } from '../../config/ChatLogics'
import UserListItem from '../UserAvatar/UserListItem'
import { ChatState } from '../../context/ChatProvider'
import { showNotification } from '../../utils/notification'
import './SideDrawer.css'

const SideDrawer = () => {
  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const searchRef = useRef(null)
  const profileRef = useRef(null)

  const {
    setSelectedChat,
    user,
    notification,
    setNotification,
    chats,
    setChats,
  } = ChatState()

  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const logoutHandler = () => {
    localStorage.removeItem('userInfo')
    navigate('/')
  }

  const handleSearch = async () => {
    if (!search) {
      alert('Please enter something in search')
      return
    }

    try {
      setLoading(true)
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
      const { data } = await axios.get(`/api/user?search=${search}`, config)
      setLoading(false)
      setSearchResult(data)
    } catch (error) {
      alert('Failed to load search results')
      setLoading(false)
    }
  }

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true)
      const config = {
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      }
      const { data } = await axios.post('/api/chat', { userId }, config)

      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats])
      }
      setSelectedChat(data)
      setLoadingChat(false)
      setShowSearchDropdown(false)
      setSearch('')
      setSearchResult([])
    } catch (error) {
      alert('Error fetching the chat')
      setLoadingChat(false)
    }
  }

  return (
    <div className="side-drawer-container">
      <div className="side-drawer-header">
        {/* Search Button and Dropdown */}
        <div className="search-container" ref={searchRef}>
          <button
            className="search-button"
            onClick={() => setShowSearchDropdown(!showSearchDropdown)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <span>Search Users</span>
          </button>

          {showSearchDropdown && (
            <div className="search-dropdown">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  autoFocus
                />
                <button className="search-submit" onClick={handleSearch}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="search-results">
                {loading ? (
                  <ChatLoading />
                ) : (
                  searchResult?.map((user) => (
                    <UserListItem
                      key={user._id}
                      user={user}
                      handleFunction={() => accessChat(user._id)}
                    />
                  ))
                )}
                {loadingChat && <div className="loading-chat">Loading chat...</div>}
              </div>
            </div>
          )}
        </div>

        <div className="app-title">Talk-A-Tive</div>

        <div className="header-icons">
          {/* Notification Icon */}
          <div 
            className="notification-icon"
            onClick={() => {
              if (notification.length > 0) {
                const latestNotification = notification[0];
                showNotification(
                  `New message from ${latestNotification.sender.name}`,
                  {
                    body: latestNotification.content.length > 30
                      ? `${latestNotification.content.substring(0, 30)}...`
                      : latestNotification.content,
                    icon: latestNotification.sender.pic
                  }
                );
              }
            }}
          >
            {notification.length > 0 && (
              <span className="notification-badge">{notification.length}</span>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          {/* Profile Dropdown */}
          <div className="profile-container" ref={profileRef}>
            <button 
              className="profile-button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <img
                className="profile-image"
                src={user.pic}
                alt={user.name}
              />
            </button>

            {showProfileDropdown && (
              <div className="profile-dropdown">
                <ProfileModal user={user}>
                  <div className="dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" className="dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>My Profile</span>
                  </div>
                </ProfileModal>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={logoutHandler}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideDrawer