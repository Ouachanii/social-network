'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Placeholder icons - we will replace these later
const navIcons = [
  { name: 'home', component: (active, theme) => <span><i className="fa-solid fa-house" style={{ color: active ? (theme === 'light' ? "#043df7ff" : "#bb86fc") : "" }}></i></span>, href: '/' },
  { name: 'followers', component: (active, theme) => <span><i className="fa-solid fa-user-group" style={{ color: active ? (theme === 'light' ? "#043df7ff" : "#bb86fc") : "" }}></i></span>, href: '/followers' },
  { name: 'groups', component: (active, theme) => <span><i className="fa-solid fa-users" style={{ color: active ? (theme === 'light' ? "#043df7ff" : "#bb86fc") : "" }}></i></span>, href: '/groups' },
  { name: 'chat', component: (active, theme) => <span><i className="fa-solid fa-message" style={{ color: active ? (theme === 'light' ? "#043df7ff" : "#bb86fc") : "" }}></i></span>, href: '/chat' },
  { name: 'notifications', component: (active, theme) => <span><i className="fa-solid fa-bell" style={{ color: active ? (theme === 'light' ? "#043df7ff" : "#bb86fc") : "" }}></i></span>, href: '/notifications' },
];

const DefaultAvatar = ({ className }) => <div className={`${styles.defaultAvatar} ${className || ''}`}></div>;

const Header = () => {
  const { user} = useUser();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [setShowNotifications] = useState(false);
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
              <div onClick={toggleTheme} className={styles.dropdownItem}>
                  {theme === 'dark' ? '☀️ light theme' : '🌙 dark theme'}
              </div>
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
