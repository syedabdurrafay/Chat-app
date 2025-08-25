import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tab } from '@headlessui/react'
import Login from '../components/Authentication/Login'
import Signup from '../components/Authentication/Signup'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userInfo'))
    if (user) navigate('/chats')
  }, [navigate])

  return (
    <div className="homepage-container">
      <div className="homepage-content">
        {/* App Title */}
        <div className="app-header">
          <h1 className="app-title">Talk</h1>
          <p className="app-subtitle">Connect with  people's in real-time</p>
        </div>

        {/* Auth Tabs */}
        <div className="auth-container">
          <Tab.Group>
            <Tab.List className="tab-list">
              <Tab
                className={({ selected }) =>
                  `tab-item ${selected ? 'tab-item-selected' : ''}`
                }
              >
                Login
              </Tab>
              <Tab
                className={({ selected }) =>
                  `tab-item ${selected ? 'tab-item-selected' : ''}`
                }
              >
                Sign Up
              </Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <Login />
              </Tab.Panel>
              <Tab.Panel>
                <Signup />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* App Features */}
        <div className="features-container">
          <h2 className="features-title">Features</h2>
          <ul className="features-list">
            <li className="feature-item">
              <svg className="feature-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Real-time messaging
            </li>
            <li className="feature-item">
              <svg className="feature-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              One-on-one and group chats
            </li>
            <li className="feature-item">
              <svg className="feature-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              User authentication
            </li>
            <li className="feature-item">
              <svg className="feature-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Profile customization
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default HomePage