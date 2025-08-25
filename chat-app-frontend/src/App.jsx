import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ChatProvider from './context/ChatProvider';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} exact />
      <Route path="/chats" element={<ChatPage />} />
    </Routes>
  );
}

export default App;