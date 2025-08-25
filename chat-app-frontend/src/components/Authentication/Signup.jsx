import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pic, setPic] = useState('');
  const [picLoading, setPicLoading] = useState(false);
  const navigate = useNavigate();

  const postDetails = (pics) => {
    setPicLoading(true);
    if (!pics) {
      alert('Please select an image!');
      return;
    }

    if (pics.type === 'image/jpeg' || pics.type === 'image/png') {
      const data = new FormData();
      data.append('file', pics);
      data.append('upload_preset', 'chat-app');
      data.append('cloud_name', 'piyushproj');
      
      fetch('https://api.cloudinary.com/v1_1/piyushproj/image/upload', {
        method: 'post',
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setPic(data.url.toString());
          setPicLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setPicLoading(false);
        });
    } else {
      alert('Please select an image!');
      setPicLoading(false);
    }
  };

  const submitHandler = async () => {
    setPicLoading(true);
    
    if (!name || !email || !password || !confirmPassword) {
      alert('Please fill all the fields');
      setPicLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      setPicLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
        },
      };

      const { data } = await axios.post(
        '/api/user',
        { name, email, password, pic },
        config
      );

      localStorage.setItem('userInfo', JSON.stringify(data));
      setPicLoading(false);
      navigate('/chats');
    } catch (error) {
      alert(error.response?.data?.message || 'Error occurred!');
      setPicLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">Create Account</h1>
      <p className="signup-subtitle">Join Talk-A-Tive to connect with friends</p>

      <div className="signup-input-group">
        <label className="signup-label">Name</label>
        <input
          type="text"
          className="signup-input"
          placeholder="Enter Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="signup-input-group">
        <label className="signup-label">Email Address</label>
        <input
          type="email"
          className="signup-input"
          placeholder="Enter Your Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="signup-input-group">
        <label className="signup-label">Password</label>
        <div className="password-input-wrapper">
          <input
            type={show ? 'text' : 'password'}
            className="signup-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="password-toggle"
            onClick={() => setShow(!show)}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="signup-input-group">
        <label className="signup-label">Confirm Password</label>
        <div className="password-input-wrapper">
          <input
            type={show ? 'text' : 'password'}
            className="signup-input"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            className="password-toggle"
            onClick={() => setShow(!show)}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="signup-input-group">
        <label className="signup-label">Profile Picture</label>
        <input
          type="file"
          className="file-upload-input"
          accept="image/*"
          onChange={(e) => postDetails(e.target.files[0])}
        />
      </div>

      <button
        className="signup-button signup-button-primary"
        onClick={submitHandler}
        disabled={picLoading}
      >
        {picLoading ? 'Uploading...' : 'Sign Up'}
      </button>
    </div>
  );
};

export default Signup;