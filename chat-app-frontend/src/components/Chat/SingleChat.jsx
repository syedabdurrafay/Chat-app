import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getSender, getSenderFull } from '../../config/ChatLogics';
import ProfileModal from '../Miscellaneous/ProfileModal';
import ScrollableChat from './ScrollableChat';
import Lottie from 'react-lottie';
import animationData from '../../animations/typing.json';
import io from 'socket.io-client';
import UpdateGroupChatModal from '../Miscellaneous/UpdateGroupChatModal';
import { ChatState } from '../../context/ChatProvider';
import { showNotification } from '../../utils/notification';
import './SingleChat.css';

const ENDPOINT = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  const { selectedChat, setSelectedChat, user, notification, setNotification } = ChatState();

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', selectedChat._id);
    }

    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      if (timeNow - lastTypingTime >= timerLength && typing) {
        socket.emit('stop typing', selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        withCredentials: true
      };

      setLoading(true);
      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      socket.emit('join chat', selectedChat._id);
      selectedChatCompare = selectedChat;
    } catch (error) {
      console.error('Failed to load messages:', error);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      alert('File size should be less than 25MB');
      return;
    }

    setFile(selectedFile);

    const previewUrl = URL.createObjectURL(selectedFile);
    const fileType = getFileType(selectedFile.name);

    setFilePreview({ 
      url: previewUrl,
      type: fileType,
      name: selectedFile.name,
      mimeType: selectedFile.type
    });
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
    return 'unknown';
  };

  const removeFile = () => {
    if (filePreview?.url) {
      URL.revokeObjectURL(filePreview.url);
    }
    setFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async () => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      };

      const { data } = await axios.post('/api/message/upload', formData, config);
      return data;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  };

  const sendMessage = async (event) => {
    if ((event.key === 'Enter' && newMessage) || (event.type === 'click' && (newMessage || file))) {
      if (!selectedChat) return;

      socket.emit('stop typing', selectedChat._id);

      try {
        let fileData = null;
        let tempFileMessage = null;
        
        if (file) {
          tempFileMessage = {
            _id: `temp-${Date.now()}`,
            sender: user,
            chat: selectedChat,
            isFile: true,
            file: {
              url: filePreview.url,
              type: filePreview.type,
              filename: file.name,
              size: file.size,
              mimeType: file.type
            },
            content: file.name,
            createdAt: new Date(),
            isTemp: true
          };

          setMessages(prev => [...prev, tempFileMessage]);
          
          fileData = await uploadFile();
          if (!fileData) {
            setMessages(prev => prev.filter(m => m._id !== tempFileMessage._id));
            alert('Failed to upload file');
            return;
          }
        }

        const config = {
          headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          withCredentials: true
        };

        const messageData = {
          content: newMessage,
          chatId: selectedChat._id,
        };

        if (fileData) {
          messageData.fileUrl = fileData.url;
          messageData.fileType = fileData.type;
          messageData.filename = fileData.filename;
          messageData.size = fileData.size;
          messageData.mimeType = fileData.mimeType;
        }

        setNewMessage('');
        setFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';

        const { data } = await axios.post(
          '/api/message',
          messageData,
          config
        );

        setMessages(prev => prev.map(m => 
          m.isTemp ? data : m
        ));

        socket.emit('new message', data);
        
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages(prev => prev.filter(m => !m.isTemp));
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        }
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT, {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.emit('setup', user);
    socket.on('connected', () => setSocketConnected(true));
    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));

    return () => {
      socket.off('connected');
      socket.off('typing');
      socket.off('stop typing');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const handleMessageReceived = (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        if (!notification.some(n => n._id === newMessageReceived._id)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
          
          showNotification(
            `New message from ${newMessageReceived.sender.name}`,
            {
              body: newMessageReceived.content.length > 30
                ? `${newMessageReceived.content.substring(0, 30)}...`
                : newMessageReceived.content,
              icon: newMessageReceived.sender.pic
            }
          );
        }
      } else {
        setMessages(prev => [...prev, newMessageReceived]);
      }
    };

    const handleMessageUpdated = (updatedMessage) => {
      setMessages(prev => prev.map(m => 
        m._id === updatedMessage._id ? updatedMessage : m
      ));
    };

    const handleMessageDeleted = (messageId) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, deleted: true } : m
      ));
    };

    socket.on('message received', handleMessageReceived);
    socket.on('message updated', handleMessageUpdated);
    socket.on('message deleted', handleMessageDeleted);

    return () => {
      socket.off('message received', handleMessageReceived);
      socket.off('message updated', handleMessageUpdated);
      socket.off('message deleted', handleMessageDeleted);
    };
  }, [messages, selectedChatCompare, notification, fetchAgain]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (filePreview?.url) {
        URL.revokeObjectURL(filePreview.url);
      }
    };
  }, [filePreview]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button
          className="back-button"
          onClick={() => setSelectedChat('')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {!selectedChat.isGroupChat ? (
          <>
            <div className="chat-title">
              {getSender(user, selectedChat.users)}
            </div>
            <ProfileModal user={getSenderFull(user, selectedChat.users)}>
              <button className="profile-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 20C6 17.7909 7.79086 16 10 16H14C16.2091 16 18 17.7909 18 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </ProfileModal>
          </>
        ) : (
          <>
            <div className="chat-title">
              {selectedChat.chatName.toUpperCase()}
            </div>
            <UpdateGroupChatModal
              fetchMessages={fetchMessages}
              fetchAgain={fetchAgain}
              setFetchAgain={setFetchAgain}
            />
          </>
        )}
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <ScrollableChat messages={messages} setMessages={setMessages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="message-input-area">
        {isTyping && (
          <div className="typing-indicator">
            <Lottie
              options={defaultOptions}
              width={70}
              style={{ marginBottom: 5 }}
            />
          </div>
        )}

        {filePreview && (
          <div className="file-preview-container">
            <div className="file-preview">
              {filePreview.type === 'image' && (
                <img src={filePreview.url} alt="Preview" className="preview-image" />
              )}
              {filePreview.type === 'video' && (
                <video controls className="preview-video">
                  <source src={filePreview.url} type={filePreview.mimeType} />
                </video>
              )}
              {filePreview.type === 'audio' && (
                <audio controls className="preview-audio">
                  <source src={filePreview.url} type={filePreview.mimeType} />
                </audio>
              )}
              {filePreview.type === 'document' && (
                <div className="document-preview">
                  <div className="document-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 4h14v2H5V4zm0 10h14v2H5v-2zm0 6h14v2H5v-2z" />
                    </svg>
                  </div>
                  <span className="document-name">{filePreview.name}</span>
                </div>
              )}
              <button className="remove-file-btn" onClick={removeFile}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        <div className="input-container">
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*, video/*, audio/*, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .mp3, .wav, .ogg"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="file-upload-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </label>

          <input
            className="message-input"
            placeholder="Type a message..."
            value={newMessage}
            onChange={typingHandler}
            onKeyDown={sendMessage}
          />

          <button className="send-button" onClick={sendMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleChat;