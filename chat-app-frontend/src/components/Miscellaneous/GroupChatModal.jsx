import { useState } from 'react'
import axios from 'axios'
import { ChatState } from '../../context/ChatProvider'
import UserBadgeItem from '../UserAvatar/UserBadgeItem'
import UserListItem from '../UserAvatar/UserListItem'
import './GroupChatModal.css'

const GroupChatModal = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [groupChatName, setGroupChatName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState([])
  const [loading, setLoading] = useState(false)
  const { user, chats, setChats } = ChatState()

  const handleGroup = (userToAdd) => {
    if (selectedUsers.includes(userToAdd)) {
      alert('User already added')
      return
    }
    setSelectedUsers([...selectedUsers, userToAdd])
  }

  const handleSearch = async (query) => {
    setSearch(query)
    if (!query) return

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
    }
  }

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id))
  }

  const handleSubmit = async () => {
    if (!groupChatName || !selectedUsers) {
      alert('Please fill all the fields')
      return
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
      const { data } = await axios.post(
        `/api/chat/group`,
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        config
      )
      setChats([data, ...chats])
      setIsOpen(false)
      alert('New group chat created!')
    } catch (error) {
      alert('Failed to create the chat!')
    }
  }

  return (
    <>
      <span onClick={() => setIsOpen(true)}>{children}</span>

      {isOpen && (
        <div className="group-chat-modal-overlay">
          <div className="group-chat-modal-content">
            <div className="group-chat-modal-title">
              Create Group Chat
            </div>
            <button
              className="group-chat-modal-close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
            <div className="flex flex-col space-y-4">
              <input
                className="group-chat-modal-input"
                placeholder="Chat Name"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
              <input
                className="group-chat-modal-input"
                placeholder="Add Users"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <div className="group-chat-users-container">
                {selectedUsers.map((u) => (
                  <UserBadgeItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleDelete(u)}
                  />
                ))}
              </div>
              {loading ? (
                <div>Loading...</div>
              ) : (
                searchResult
                  ?.slice(0, 4)
                  .map((user) => (
                    <UserListItem
                      key={user._id}
                      user={user}
                      handleFunction={() => handleGroup(user)}
                    />
                  ))
              )}
              <button
                className="group-chat-modal-button"
                onClick={handleSubmit}
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GroupChatModal