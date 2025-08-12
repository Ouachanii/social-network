"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "../styles/notifications.module.css";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!token || !isLoggedIn) {
      router.replace('/login');
      return;
    }
    
    setIsAuthenticated(true);
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch("http://localhost:8080/api/notifications", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        router.replace('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`http://localhost:8080/api/notifications/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ notification_id: notificationId }),
      });

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Show loading only if authenticated and still loading
  if (!isAuthenticated) {
    return null; // Don't show anything while redirecting
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2 className={styles.errorTitle}>Something went wrong</h2>
        <p className={styles.errorMessage}>{error}</p>
        <button
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.notificationsContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
      </div>

      {notifications.length > 0 ? (
        <div className={styles.list}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${notification.isRead === 0 ? styles.unread : styles.read}`}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className={styles.avatar}>
                {notification.senderAvatar ? (
                  <img
                    src={notification.senderAvatar}
                    alt="Sender"
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.defaultAvatar}>
                    <i className="fa-solid fa-user" style={{color: '#9b4ef3'}}></i>
                  </div>
                )}
              </div>
              <div className={styles.content}>
                <p className={styles.message}>{notification.message}</p>
                <span className={styles.timestamp}>
                  {new Date(notification.createdAt).toLocaleDateString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No notifications yet</p>
        </div>
      )}
    </div>
  );
}
