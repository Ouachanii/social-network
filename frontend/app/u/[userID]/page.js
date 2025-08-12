"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from "../../context/UserContext";
import styles from "../../styles/profile.module.css";
import { PostFeed } from "../../posts/PostFeed";
import { CreatePost } from "../../posts/create_post";
import { ProfileSidebar } from "../../components/ProfileSidebar";
import { getAvatarUrl, hasAvatar } from "../../utils/avatarUtils";

export default function UserProfilePage({ params }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followStatus, setFollowStatus] = useState("");
  const fileInputRef = useRef(null);
  const { refetchUser } = useUser();
  
  const userID = params.userID;

  const handleAvatarClick = () => {
    // Only allow changing avatar if the user is the owner of the profile
    if (user && user.is_owner) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch("http://localhost:8080/api/upload/avatar", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      // Refresh profile data to show the new avatar
      fetchProfile();
      // Also refetch the global user context to update other components like the home page
      if (refetchUser) {
        refetchUser();
      }

    } catch (err) {
      console.error("Error uploading avatar:", err);
    }
  };

  const handleFollow = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8080/api/follow/${userID}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Follow request failed');
      }
      
      const data = await response.json();
      // Update status locally for immediate feedback
      if (data.message.includes("request sent")) {
        setFollowStatus("pending");
      } else {
        setFollowStatus("approved");
      }

    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  const fetchProfile = useCallback(async () => {
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`http://localhost:8080/api/profile/${userID}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setUser(data);
      setPosts(data.posts || []);
      setFollowStatus(data.follow_status || "not_following");
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error.message || 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, [router, userID]);

  useEffect(() => {
    if (userID) {
      fetchProfile();
    }
  }, [fetchProfile, userID]);

  // Follow logic will be added here later

  if (isLoading) {
    return <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className={styles.errorContainer}><div className={styles.errorIcon}>⚠️</div><h2>Something went wrong</h2><p>{error}</p></div>;
  }

  if (!user) {
    return <div className={styles.errorContainer}><div className={styles.errorIcon}>🤔</div><h2>Profile Not Found</h2></div>;
  }

  // Handle private profile view
  if (user.is_private) {
    return (
        <div className={styles.profileContainer}>
            <div className={styles.coverPhoto}>
                <div className={styles.profileHeader}>
                    <img 
                        src={user.avatar ? `http://localhost:8080/${user.avatar}` : '/default-avatar.jpg'} 
                        alt="Profile" 
                        className={styles.avatar}
                    />
                    <h1 className={styles.name}>{user.first_name} {user.last_name}</h1>
                    <p className={styles.privateMessage}>This account is private</p>
                    {/* Add Follow Button here */}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.coverPhoto}>
        <div className={styles.profileHeader}>
            <div className={styles.avatarContainer} onClick={handleAvatarClick}>
              <img 
                  src={hasAvatar(user.avatar) ? getAvatarUrl(user.avatar) : '/default-avatar.jpg'} 
                  alt="Profile" 
                  className={styles.avatar}
                  onError={(e) => {
                    e.target.src = '/default-avatar.jpg';
                  }}
              />
              {user.is_owner && (
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/gif"
                />
              )}
            </div>
            <h1 className={styles.name}>{user.first_name} {user.last_name}</h1>
            <p className={styles.postCount}>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
            <div className={styles.actions}>
                {user.is_owner ? (
                    <button className={styles.privacyButton}>Edit Profile</button>
                ) : (
                    <button className={styles.primaryButton} onClick={handleFollow} disabled={followStatus === 'approved' || followStatus === 'pending'}>
                        {followStatus === 'approved' ? 'Following' : followStatus === 'pending' ? 'Pending' : 'Follow'}
                    </button>
                )}
            </div>
        </div>
      </div>
      <div className={styles.profileLayout}>
        <div className={styles.mainContent}>
          {user.is_owner && <CreatePost onPostCreated={fetchProfile} avatarUrl={hasAvatar(user.avatar) ? getAvatarUrl(user.avatar) : '/default-avatar.jpg'} />}
          <PostFeed initialPosts={posts} />
        </div>
        <ProfileSidebar user={user} onAboutMeUpdate={fetchProfile} />
      </div>
    </div>
  );
}
