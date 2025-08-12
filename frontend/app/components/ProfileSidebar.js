"use client";
import React, { useState } from 'react';
import styles from '../styles/profile.module.css';

export function ProfileSidebar({ user, onAboutMeUpdate }) {
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [aboutMeText, setAboutMeText] = useState(user?.about_me || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleAboutMeSubmit = async () => {
    if (!user || !user.is_owner) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:8080/api/profile/about-me', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ about_me: aboutMeText }),
      });

      if (response.ok) {
        setIsEditingAboutMe(false);
        if (onAboutMeUpdate) {
          onAboutMeUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating about me:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyToggle = async () => {
    if (!user || !user.is_owner) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:8080/api/privacy/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        if (onAboutMeUpdate) {
          onAboutMeUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.profileSidebar}>
      <div className={styles.sidebarSection}>
        <h3>About Me</h3>
        {user.is_owner ? (
          <div>
            {isEditingAboutMe ? (
              <div>
                <textarea
                  value={aboutMeText}
                  onChange={(e) => setAboutMeText(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className={styles.aboutMeTextarea}
                />
                <div className={styles.editButtons}>
                  <button 
                    onClick={handleAboutMeSubmit}
                    disabled={isLoading}
                    className={styles.saveButton}
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setIsEditingAboutMe(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className={styles.aboutMeText}>
                  {user.about_me || 'No information provided.'}
                </p>
                <button 
                  onClick={() => setIsEditingAboutMe(true)}
                  className={styles.editButton}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className={styles.aboutMeText}>
            {user.about_me || 'No information provided.'}
          </p>
        )}
      </div>

      {user.is_owner && (
        <div className={styles.sidebarSection}>
          <h3>Privacy Settings</h3>
          <div className={styles.privacyToggle}>
            <span>Profile is {user.is_public ? 'Public' : 'Private'}</span>
            <button 
              onClick={handlePrivacyToggle}
              className={`${styles.toggleButton} ${user.is_public ? styles.public : styles.private}`}
            >
              {user.is_public ? 'Public' : 'Private'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.sidebarSection}>
        <h3>Profile Information</h3>
        <div className={styles.profileInfo}>
          <p><strong>Name:</strong> {user.firstname} {user.lastname}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {user.nickname && <p><strong>Nickname:</strong> {user.nickname}</p>}
          <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>
          <p><strong>Gender:</strong> {user.gender}</p>
        </div>
      </div>
    </div>
  );
}



