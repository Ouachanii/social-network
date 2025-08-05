'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { useUser } from '../context/UserContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Placeholder icons - we will replace these later
const HomeIcon = () => <span><i className="fa-solid fa-house"  style={{color: '#9b4ef3ff',}}></i></span>;
const FriendsIcon = () => <span><i className="fa-solid fa-user-group" style={{color: '#9b4ef3ff',}}></i></span>;
const GroupsIcon = () => <span><i className="fa-solid fa-users" style={{color: '#9b4ef3ff',}}></i></span>;
const NotificationsIcon = () => <span>
  <i className="fa-solid fa-bell" style={{color: '#9b4ef3ff',}}></i>
</span>;
const ChatIcon = () => <span><i className="fa-solid fa-message" style={{color: '#9b4ef3ff',}}></i></span>;

const DefaultAvatar = ({ className }) => <div className={`${styles.defaultAvatar} ${className || ''}`}></div>;

const Header = () => {
  const { user, setUser } = useUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <Link href="/" className={styles.logo}>
          Social Network
        </Link>
      </div>

      <nav className={styles.navSection}>
        <Link href="/" className={styles.navLink} title="Home">
          <HomeIcon />
        </Link>
        <Link href="/followers" className={styles.navLink} title="Followers">
          <FriendsIcon />
        </Link>
        <Link href="/groups" className={styles.navLink} title="Groups">
          <GroupsIcon />
        </Link>
         <Link href="/chat" className={styles.navLink} title="chat">
          <ChatIcon />
        </Link>
      </nav>

      <div className={styles.rightSection}>
        <div className={styles.iconWrapper} onClick={() => setShowNotifications(!showNotifications)} ref={notificationsRef}>
          <NotificationsIcon />
          {showNotifications && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>Notifications</div>
              {/* Placeholder for notifications */}
              <div className={styles.dropdownItem}>User X sent you a follow request.</div>
              <div className={styles.dropdownItem}>Your post got a new comment.</div>
              <Link href="/notifications" className={styles.dropdownSeeAll}>
                See All
              </Link>
            </div>
          )}
        </div>
        
        <div className={styles.profileWrapper} onClick={() => setShowProfileMenu(!showProfileMenu)} ref={profileMenuRef}>
          {user && user.avatar ? (
            <img src={`http://localhost:8080/uploads/avatars/${user.avatar}`} alt="Profile" className={styles.profileAvatar} />
          ) : (
            <DefaultAvatar className={styles.profileAvatar} />
          )}
          {showProfileMenu && (
            <div className={styles.dropdownMenu}>
              <Link href="/profile" className={styles.dropdownItem}>
                <div className={styles.profileLink}>
                  {user && user.avatar ? (
                    <img src={`http://localhost:8080/uploads/avatars/${user.avatar}`} alt="Profile" className={styles.dropdownAvatar} />
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
