import { useState, useEffect } from 'react';
import SideDrawer from '../components/Miscellaneous/SideDrawer';
import MyChats from '../components/Chat/MyChats';
import ChatBox from '../components/Chat/ChatBox';
import { ChatState } from '../context/ChatProvider';
import './ChatPage.css';

const ChatPage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const { user } = ChatState();

  // Initialize theme from localStorage or prefer-color-scheme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  // Auto-close sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="quantum-chat">
      {user && (
        <header className="neuro-header">
          <div className="header-container">
            <div className="header-left">
              <button 
                className="quantum-control menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <h1 className="app-title">
                <span className="logo-icon">💬</span>
                <span>Talk</span>
              </h1>
            </div>
            <div className="header-right">
              <button 
                className="theme-toggle quantum-control"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <svg className="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <svg className="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </button>
              <SideDrawer />
            </div>
          </div>
        </header>
      )}
      
      <div className="quantum-grid">
        {user && (
          <>
            <aside className={`quantum-sidebar ${sidebarOpen ? 'open' : ''}`}>
              <MyChats 
                fetchAgain={fetchAgain} 
                onSelectChat={() => setSidebarOpen(false)}
              />
            </aside>
            
            <main className="neural-chat">
              <ChatBox 
                fetchAgain={fetchAgain} 
                setFetchAgain={setFetchAgain} 
              />
            </main>
            
            {sidebarOpen && (
              <div 
                className="sidebar-backdrop"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </>
        )}
      </div>

      {/* Floating UI elements */}
      <div className="floating-ui">
        <div className="hologram-node node-1"></div>
        <div className="hologram-node node-2"></div>
        <div className="hologram-node node-3"></div>
      </div>
    </div>
  );
};

export default ChatPage;