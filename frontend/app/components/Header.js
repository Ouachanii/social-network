'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { getAvatarUrl, hasAvatar } from '../utils/avatarUtils';

// Navigation icons with purple theme
const navIcons = [
  { name: 'home', component: (active) => <span><i className="fa-solid fa-house" style={{ color: active ? "#9b4ef3" : "#65676b" }}></i></span>, href: '/' },
  { name: 'followers', component: (active) => <span><i className="fa-solid fa-user-group" style={{ color: active ? "#9b4ef3" : "#65676b" }}></i></span>, href: '/followers' },
  { name: 'groups', component: (active) => <span><i className="fa-solid fa-users" style={{ color: active ? "#9b4ef3" : "#65676b" }}></i></span>, href: '/groups' },
  { name: 'chat', component: (active) => <span><i className="fa-solid fa-message" style={{ color: active ? "#9b4ef3" : "#65676b" }}></i></span>, href: '/chat' },
];

const DefaultAvatar = ({ className }) => <div className={`${styles.defaultAvatar} ${className || ''}`}></div>;

const Header = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  

  

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const router = useRouter();
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
  };



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Handle follow request response
  const handleFollowResponse = async (notificationId, response, senderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const method = response === 'accept' ? 'PATCH' : 'DELETE';
      const notificationData = {
        id: notificationId,
        sender_id: senderId,
        receiver_id: user.id,
        related_id: notificationId
      };

      const apiResponse = await fetch('/api/followResponse', {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      if (apiResponse.ok) {
        // Remove the notification from the list
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        // Refresh notifications
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error responding to follow request:', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <Link href="/" className={styles.logo}>
          Social Network
        </Link>
      </div>

      <nav className={styles.navSection}>
        {navIcons.map((icon) => (
          <Link
            key={icon.name}
            href={icon.href}
            className={styles.navLink}
            title={icon.name.charAt(0).toUpperCase() + icon.name.slice(1)}
            onClick={() => setActiveNav(icon.name)}
          >
            {icon.component(activeNav === icon.name, theme)}
          </Link>
        ))}
      </nav>

      <div className={styles.rightSection}>
        {/* Notifications Icon */}
        <div className={styles.notificationsWrapper} onClick={() => setShowNotifications(!showNotifications)} ref={notificationsRef}>
          <i className="fa-solid fa-bell" style={{ color: "#9b4ef3", fontSize: "20px" }}></i>
          {notifications.length > 0 && (
            <div className={styles.notificationBadge}>{notifications.length}</div>
          )}
          {showNotifications && (
            <div className={styles.notificationsDropdown}>
              <div className={styles.notificationsHeader}>
                <h3>Notifications</h3>
              </div>
              <div className={styles.notificationsList}>
                {isLoadingNotifications ? (
                  <div className={styles.loadingMessage}>Loading...</div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className={styles.notificationItem}>
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationText}>
                          {notification.type === 'new follower' && (
                            <span><strong>{notification.sender_name}</strong> followed you.</span>
                          )}
                          {notification.type === 'follow request' && (
                            <span><strong>{notification.sender_name}</strong> sent you a friend request.</span>
                          )}
                        </p>
                        {notification.type === 'follow request' && (
                          <div className={styles.notificationActions}>
                            <button 
                              className={styles.acceptButton}
                              onClick={() => handleFollowResponse(notification.id, 'accept', notification.sender_id)}
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button 
                              className={styles.declineButton}
                              onClick={() => handleFollowResponse(notification.id, 'decline', notification.sender_id)}
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyMessage}>No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className={styles.profileWrapper} onClick={() => setShowProfileMenu(!showProfileMenu)} ref={profileMenuRef}>
          {user && hasAvatar(user.avatar) ? (
            <img 
              src={getAvatarUrl(user.avatar)} 
              alt="Profile" 
              className={styles.profileAvatar}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <DefaultAvatar className={styles.profileAvatar} />
          )}
          {showProfileMenu && (
            <div className={styles.dropdownMenu}>
              <Link href="/profile" className={styles.dropdownItem}>
                <div className={styles.profileLink}>
                  {user && hasAvatar(user.avatar) ? (
                    <img 
                      src={getAvatarUrl(user.avatar)} 
                      alt="Profile" 
                      className={styles.dropdownAvatar}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <DefaultAvatar className={styles.dropdownAvatar} />
                  )}
                  <span>Profile</span>
                </div>
              </Link>
              <div onClick={handleLogout} className={styles.dropdownItem}>
                <i className="fa-solid fa-power-off" style={{color: "red",}}></i> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
