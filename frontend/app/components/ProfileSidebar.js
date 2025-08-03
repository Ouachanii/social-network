"use client";
import React, { useState } from 'react';
import styles from '../styles/profile.module.css';

export function ProfileSidebar({ user, onAboutMeUpdate }) {
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [aboutMeText, setAboutMeText] = useState(user.about_me || '');

  const handleAboutMeSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8080/api/profile/about-me", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ about_me: aboutMeText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update about me');
      }

      // Notify parent to refetch data
      if (onAboutMeUpdate) {
        onAboutMeUpdate();
      }
      setIsEditingAboutMe(false);

    } catch (err) {
      console.error("Error updating about me:", err);
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarSection}>
        <h3 className={styles.sidebarTitle}>Details</h3>
        <p><strong>Nickname:</strong> {user.nickname}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Birthday:</strong> {user.date_of_birth}</p>
      </div>

      <div className={styles.sidebarSection}>
        <h3 className={styles.sidebarTitle}>About Me</h3>
        {isEditingAboutMe ? (
          <div>
            <textarea
              className={styles.aboutMeTextarea}
              value={aboutMeText}
              onChange={(e) => setAboutMeText(e.target.value)}
              rows="5"
            />
            <button className={styles.primaryButton} onClick={handleAboutMeSave}>Save</button>
            <button className={styles.secondaryButton} onClick={() => setIsEditingAboutMe(false)}>Cancel</button>
          </div>
        ) : (
          <div>
            {user.about_me ? (
              <p>{user.about_me}</p>
            ) : (
              <p>You haven't added anything about yourself yet.</p>
            )}
            <button className={styles.editButton} onClick={() => setIsEditingAboutMe(true)}>
              {user.about_me ? 'Edit' : 'Add About Me'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
