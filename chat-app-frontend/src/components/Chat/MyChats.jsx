import { useState, useEffect } from 'react'
import axios from 'axios'
import { ChatState } from '../../context/ChatProvider'
import { getSender } from '../../config/ChatLogics'
import GroupChatModal from '../Miscellaneous/GroupChatModal'
import ChatLoading from './ChatLoading'
import './MyChats.css'

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState()
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState()

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }

      const { data } = await axios.get('/api/chat', config)
      setChats(data)
    } catch (error) {
      alert('Failed to load chats')
    }
  }

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem('userInfo')))
    fetchChats()
  }, [fetchAgain])

  return (
    <div className={`chats-sidebar ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
      <div className="sidebar-header">
        <h2>My Chats</h2>
        <GroupChatModal>
          <button className="new-group-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Group
          </button>
        </GroupChatModal>
      </div>
      
      <div className="chats-list">
        {chats ? (
          chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => setSelectedChat(chat)}
              className={`chat-item ${selectedChat === chat ? 'active' : ''}`}
            >
              <div className="chat-info">
                <h3 className="chat-name">
                  {!chat.isGroupChat ? getSender(loggedUser, chat.users) : chat.chatName}
                </h3>
                {chat.latestMessage && (
                  <p className="last-message">
                    <span className="sender">{chat.latestMessage.sender.name}: </span>
                    {chat.latestMessage.content.length > 30
                      ? `${chat.latestMessage.content.substring(0, 30)}...`
                      : chat.latestMessage.content}
                  </p>
                )}
              </div>
              {!chat.isGroupChat && (
                <button className="view-profile-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 5C7.58172 5 4 8.58172 4 13C4 17.4183 7.58172 21 12 21C16.4183 21 20 17.4183 20 13C20 8.58172 16.4183 5 12 5Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              )}
            </div>
          ))
        ) : (
          <ChatLoading />
        )}
      </div>
    </div>
  )
}

export default MyChats