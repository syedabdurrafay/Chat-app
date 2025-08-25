import { ChatState } from '../../context/ChatProvider'
import SingleChat from './SingleChat'
import './ChatBox.css'

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState()

  return (
    <div className={`chat-content ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
      {selectedChat ? (
        <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
      ) : (
        <div className="empty-chat">
          <div className="empty-chat-illustration">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
              <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.4183 21 12 21C7.58172 21 3 16.4183 3 12C3 7.58172 7.58172 3 12 3C16.4183 3 21 7.58172 21 12Z" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>No chat selected</h3>
          <p>Select a chat from the sidebar to start messaging</p>
        </div>
      )}
    </div>
  )
}

export default ChatBox