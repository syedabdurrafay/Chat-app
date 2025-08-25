import './ChatLoading.css'

const ChatLoading = () => {
  return (
    <div className="chat-loading-container">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="chat-loading-skeleton"></div>
      ))}
    </div>
  )
}

export default ChatLoading