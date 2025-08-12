"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/followers.module.css";

export default function FollowersPage() {
  const router = useRouter();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch available users
      const availableResponse = await fetch('/api/users/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        setAvailableUsers(availableData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/follow/${userId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove user from available list and refresh data
        setAvailableUsers(prev => prev.filter(user => user.id !== userId));
        fetchAllData(); // Refresh all data to update counts
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.followersPage}>
      <div className={styles.tabs}>
        <button className={styles.tab}>
          People to Follow ({availableUsers.length})
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>People to Follow</h2>
          {availableUsers.length > 0 ? (
            <div className={styles.usersList}>
              {availableUsers.map((user) => (
                                  <div key={user.id} className={styles.userItem} onClick={() => router.push(`/profile/${user.id}`)}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {user.avatar ? (
                          <img 
                            src={`http://localhost:8080/uploads/avatars/${user.avatar.split('/').pop()}`} 
                            alt="Avatar" 
                          />
                        ) : (
                          <div className={styles.defaultAvatar}></div>
                        )}
                      </div>
                      <div className={styles.userDetails}>
                        <span className={styles.userName}>
                          {user.fname} {user.lname}
                        </span>
                        <span className={styles.userInfo}>
                          {user.nickname && user.nickname.String && `@${user.nickname.String}`}
                        </span>
                      </div>
                    </div>
                    <button 
                      className={styles.followButton}
                      onClick={() => handleFollow(user.id)}
                    >
                      Add Friend
                    </button>
                  </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyMessage}>
              <i className="fa-solid fa-users"></i>
              <p>No users available to follow</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
