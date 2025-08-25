import { useState, useEffect, useRef } from 'react';
import ScrollableFeed from 'react-scrollable-feed';
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from '../../config/ChatLogics';
import { ChatState } from '../../context/ChatProvider';
import axios from 'axios';
import './ScrollableChat.css';
import EmojiPicker from 'emoji-picker-react';

const FALLBACK_AVATAR = '/images/fallback-avatar.png';
const FALLBACK_IMAGE = '/images/fallback-image.png';

const ScrollableChat = ({ messages, setMessages }) => {
  const { user, selectedChat, socket } = ChatState();
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [showEmojiPickerForMessage, setShowEmojiPickerForMessage] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getConfig = () => ({
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.token}`,
    },
    withCredentials: true
  });

  const handleImageError = (e, fallbackType = 'avatar') => {
    e.target.onerror = null;
    e.target.src = fallbackType === 'avatar' ? FALLBACK_AVATAR : FALLBACK_IMAGE;
    e.target.style.objectFit = 'cover';
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const { data } = await axios.put(
        `/api/message/react/${messageId}`,
        { emoji },
        getConfig()
      );
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? data : msg
      ));
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const startEditing = (message) => {
    setEditingMessageId(message._id);
    setEditedContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const saveEditedMessage = async (messageId) => {
    try {
      const { data } = await axios.put(
        `/api/message/${messageId}`,
        { content: editedContent },
        getConfig()
      );
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? data : msg
      ));
      
      setEditingMessageId(null);
      setEditedContent('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await axios.delete(
          `/api/message/${messageId}`,
          getConfig()
        );
        
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, deleted: true } : msg
        ));
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const toggleEmojiPicker = (messageId) => {
    setShowEmojiPickerForMessage(showEmojiPickerForMessage === messageId ? null : messageId);
  };

  const handleFileClick = (file) => {
    if (!file?.url) return;

    let url = file.url;
    
    // Handle relative paths
    if (!url.startsWith('http') && !url.startsWith('/')) {
      url = `/${url}`;
    }
    
    // Handle local development paths
    if (!url.startsWith('http') && !url.startsWith('blob:')) {
      url = `http://localhost:5000${url}`;
    }

    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    
    // Add download attribute for non-viewable files
    if (!['image', 'video', 'audio'].includes(file.type)) {
      a.download = file.filename || 'download';
    }
    
    a.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFileMessage = (m) => {
    if (!m.file) return null;

    const fileUrl = m.file.url.startsWith('http') ? m.file.url : `http://localhost:5000${m.file.url}`;
    const isImage = m.file.type === 'image';
    const isVideo = m.file.type === 'video';
    const isAudio = m.file.type === 'audio';

    return (
      <div className="file-message-container">
        {isImage && (
          <img 
            src={fileUrl}
            alt="Sent file" 
            className="message-file-image"
            onClick={() => handleFileClick(m.file)}
            onError={(e) => handleImageError(e, 'image')}
            loading="lazy"
          />
        )}
        {isVideo && (
          <video 
            controls 
            className="message-file-video"
            onClick={() => handleFileClick(m.file)}
            preload="metadata"
          >
            <source src={fileUrl} type={m.file.mimeType || 'video/mp4'} />
            Your browser does not support the video tag.
          </video>
        )}
        {isAudio && (
          <audio 
            controls 
            className="message-file-audio"
            preload="metadata"
          >
            <source src={fileUrl} type={m.file.mimeType || 'audio/mp3'} />
            Your browser does not support the audio element.
          </audio>
        )}
        {!isImage && !isVideo && !isAudio && (
          <div 
            className="message-file-document-container"
            onClick={() => handleFileClick(m.file)}
          >
            <div className="document-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2"/>
                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="document-info">
              <span className="document-name">{m.file.filename}</span>
              <span className="document-size">{formatFileSize(m.file.size)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ScrollableFeed>
      {messages && messages.map((m, i) => (
        <div 
          className={`message-container ${m.sender._id === user._id ? 'right' : 'left'}`} 
          key={m._id}
        >
          {(isSameSender(messages, m, i, user._id) ||
            isLastMessage(messages, i, user._id)) && (
            <div className="message-avatar">
              <img
                src={m.sender.pic}
                alt={m.sender.name}
                title={m.sender.name}
                onError={(e) => handleImageError(e, 'avatar')}
              />
            </div>
          )}
          
          {m.deleted ? (
            <div className="deleted-message">
              Message deleted
            </div>
          ) : (
            <div className="message-content-wrapper">
              <div
                className={`message-bubble ${
                  m.sender._id === user._id ? 'sender' : 'receiver'
                }`}
                style={{
                  marginLeft: isSameSenderMargin(messages, m, i, user._id),
                  marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                }}
              >
                {editingMessageId === m._id ? (
                  <div className="edit-message-container">
                    <input
                      type="text"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      autoFocus
                      className="edit-message-input"
                    />
                    <div className="edit-message-actions">
                      <button 
                        onClick={() => saveEditedMessage(m._id)}
                        className="save-edit-btn"
                      >
                        Save
                      </button>
                      <button 
                        onClick={cancelEditing}
                        className="cancel-edit-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {m.isFile ? (
                      <div className="file-message">
                        {renderFileMessage(m)}
                      </div>
                    ) : (
                      <div className="text-message">
                        {m.content}
                        {m.isEdited && (
                          <span className="edited-badge">(edited)</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="message-actions">
                {m.sender._id === user._id && !m.deleted && editingMessageId !== m._id && (
                  <>
                    <button 
                      onClick={() => startEditing(m)}
                      className="message-action-btn edit-btn"
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => deleteMessage(m._id)}
                      className="message-action-btn delete-btn"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}
                {!m.deleted && (
                  <button
                    onClick={() => toggleEmojiPicker(m._id)}
                    className="message-action-btn react-btn"
                    title="Add reaction"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M14 9a2 2 0 1 0-4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 15a6 6 0 0 1-6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                )}
              </div>

              {showEmojiPickerForMessage === m._id && (
                <div className="emoji-picker-container">
                  <EmojiPicker
                    width={300}
                    height={350}
                    onEmojiClick={(emojiData) => {
                      handleReaction(m._id, emojiData.emoji);
                      setShowEmojiPickerForMessage(null);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {!m.deleted && m.reactions?.length > 0 && (
            <div 
              className={`message-reactions ${
                m.sender._id === user._id ? 'reactions-right' : 'reactions-left'
              }`}
              style={{
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
              }}
            >
              {Array.from(new Set(m.reactions.map(r => r.emoji))).map(emoji => {
                const users = m.reactions.filter(r => r.emoji === emoji).map(r => r.userId.name);
                return (
                  <span 
                    key={emoji} 
                    className="reaction-emoji"
                    title={users.join(', ')}
                    onClick={() => handleReaction(m._id, emoji)}
                  >
                    {emoji}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </ScrollableFeed>
  );
};

export default ScrollableChat;