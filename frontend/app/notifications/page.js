"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "../styles/notifications.module.css";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch("http://localhost:8080/api/notifications", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('isLoggedIn');
          router.replace('/login');
          return;
        }
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      console.log(`Fetched notifications: ${JSON.stringify(data.notifications)}`);
      
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [router]);

  const handleNotificationClick = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      console.log(`Marking notification ${notificationId} as read`);

      // Mark notification as read
      await fetch(`http://localhost:8080/api/notifications/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ notification_id: notificationId }),
      });

      // Update local state
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
          onClick={fetchNotifications}
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
          <span> { notifications.map(notification => (
          console.log(`Notification ID: ${notification
          }`)
    
          ))}</span>
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${notification.isRead === 0 ? styles.unread : styles.read
                }`}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <span>

                {/* {notification.isRead } lhjkhkjhkjhjk */}
              </span>
              <div className={styles.avatar}>
                {notification.senderAvatar && (
                  <img
                    src={notification.senderAvatar}
                    alt="Sender"
                    className={styles.avatar}
                  />
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
