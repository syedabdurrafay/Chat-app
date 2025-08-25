import { useState } from 'react'
import axios from 'axios'
import { ChatState } from '../../context/ChatProvider'
import UserBadgeItem from '../UserAvatar/UserBadgeItem'
import UserListItem from '../UserAvatar/UserListItem'
import './UpdateGroupChatModal.css'

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [groupChatName, setGroupChatName] = useState('')
  const [search, setSearch] = useState('')
  const [searchResult, setSearchResult] = useState([])
  const [loading, setLoading] = useState(false)
  const [renameLoading, setRenameLoading] = useState(false)
  const { selectedChat, setSelectedChat, user } = ChatState()

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

  const handleRename = async () => {
    if (!groupChatName) return

    try {
      setRenameLoading(true)
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
      const { data } = await axios.put(
        `/api/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        },
        config
      )
      setSelectedChat(data)
      setFetchAgain(!fetchAgain)
      setRenameLoading(false)
    } catch (error) {
      alert('Error renaming group')
      setRenameLoading(false)
    }
    setGroupChatName('')
  }

  const handleAddUser = async (user1) => {
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      alert('User already in group!')
      return
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      alert('Only admins can add someone!')
      return
    }

    try {
      setLoading(true)
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
      const { data } = await axios.put(
        `/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      )
      setSelectedChat(data)
      setFetchAgain(!fetchAgain)
      setLoading(false)
    } catch (error) {
      alert('Error adding user')
      setLoading(false)
    }
    setGroupChatName('')
  }

  const handleRemove = async (user1) => {
    if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
      alert('Only admins can remove someone!')
      return
    }

    try {
      setLoading(true)
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
      const { data } = await axios.put(
        `/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      )
      user1._id === user._id ? setSelectedChat() : setSelectedChat(data)
      setFetchAgain(!fetchAgain)
      fetchMessages()
      setLoading(false)
    } catch (error) {
      alert('Error removing user')
      setLoading(false)
    }
    setGroupChatName('')
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>View</button>

      {isOpen && (
        <div className="update-group-modal-overlay">
          <div className="update-group-modal-content">
            <div className="update-group-modal-title">
              {selectedChat.chatName}
            </div>
            <button
              className="update-group-modal-close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
            <div className="flex flex-col space-y-4">
              <div className="update-group-users-container">
                {selectedChat.users.map((u) => (
                  <UserBadgeItem
                    key={u._id}
                    user={u}
                    admin={selectedChat.groupAdmin}
                    handleFunction={() => handleRemove(u)}
                  />
                ))}
              </div>
              <div className="update-group-input-container">
                <input
                  className="update-group-input"
                  placeholder="Chat Name"
                  value={groupChatName}
                  onChange={(e) => setGroupChatName(e.target.value)}
                />
                <button
                  className="update-group-button"
                  onClick={handleRename}
                  disabled={renameLoading}
                >
                  {renameLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
              <input
                className="update-group-input"
                placeholder="Add User to group"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {loading ? (
                <div className="update-group-spinner">
                  <div className="update-group-spinner-circle"></div>
                </div>
              ) : (
                searchResult?.map((user) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    handleFunction={() => handleAddUser(user)}
                  />
                ))
              )}
              <button
                className="update-group-leave-button"
                onClick={() => handleRemove(user)}
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UpdateGroupChatModal