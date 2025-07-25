"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "../styles/profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("about");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }

        try {
          // Test if server is available first
          const testResponse = await fetch("http://localhost:8080/health", {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!testResponse.ok) {
            throw new Error('Server is not responding');
          }
        } catch (error) {
          setError('Unable to connect to server. Please make sure the backend is running.');
          setIsLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8080/api/profile", {
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
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.profile) {
          throw new Error('Profile data not found');
        }

        setProfile(data.profile);
        setPosts(data.posts || []);
        setFollowers(data.followers || []);
        setFollowing(data.following || []);
        setPrivacy(data.privacy || "public");
        setError(null);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(error.message || 'Failed to load profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePrivacyToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage("Please log in to update privacy settings");
        return;
      }

      const newPrivacy = privacy === "public" ? "private" : "public";
      const response = await fetch("http://localhost:8080/api/privacy/update", {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': "application/json" 
        },
        credentials: 'include',
        body: JSON.stringify({ privacy: newPrivacy })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('isLoggedIn');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setPrivacy(newPrivacy);
      setMessage("Privacy settings updated successfully!");
    } catch (error) {
      console.error("Error updating privacy:", error);
      setMessage("Failed to update privacy settings. Please try again later.");
    }
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(""), 3000);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button 
          className={styles.primaryButton}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>🤔</div>
        <h2>Profile Not Found</h2>
        <p>We couldn't find your profile information.</p>
        <button 
          className={styles.primaryButton}
          onClick={() => router.replace('/login')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.coverPhoto}></div>
      
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <img 
            src={profile.avatarUrl || '/default-avatar.png'} 
            alt="Profile" 
            className={styles.avatar}
          />
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{profile.firstName} {profile.lastName}</h1>
            <div className={styles.stats}>
              {followers.length} followers · {following.length} following
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handlePrivacyToggle}>
                {privacy === "public" ? "Make Private" : "Make Public"}
              </button>
              <button className={styles.secondaryButton}>Edit Profile</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.navigation}>
        <div 
          className={`${styles.navItem} ${activeTab === 'about' ? styles.active : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </div>
        <div 
          className={`${styles.navItem} ${activeTab === 'posts' ? styles.active : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </div>
        <div 
          className={`${styles.navItem} ${activeTab === 'friends' ? styles.active : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </div>
        <div 
          className={`${styles.navItem} ${activeTab === 'photos' ? styles.active : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photos
        </div>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.content}>
        {activeTab === 'about' && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>About</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email:</span>
                  {profile.email}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Birthday:</span>
                  {profile.dateOfBirth}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nickname:</span>
                  {profile.nickname}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Privacy:</span>
                  {privacy}
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>About Me</h2>
              <p>{profile.aboutMe}</p>
            </div>
          </>
        )}

        {activeTab === 'posts' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Posts</h2>
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post.id} className={styles.post}>
                  <p>{post.content}</p>
                </div>
              ))
            ) : (
              <p>No posts yet</p>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Friends</h2>
            <div className={styles.friendsGrid}>
              <div>
                <h3>Followers ({followers.length})</h3>
                {followers.length > 0 ? (
                  followers.map(follower => (
                    <div key={follower.id} className={styles.friendItem}>
                      {follower.nickname || follower.email}
                    </div>
                  ))
                ) : (
                  <p>No followers yet</p>
                )}
              </div>
              <div>
                <h3>Following ({following.length})</h3>
                {following.length > 0 ? (
                  following.map(follow => (
                    <div key={follow.id} className={styles.friendItem}>
                      {follow.nickname || follow.email}
                    </div>
                  ))
                ) : (
                  <p>Not following anyone yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Photos</h2>
            <p>No photos uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
