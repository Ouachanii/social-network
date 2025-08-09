"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import styles from "../profile.module.css";

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  } else {
    throw new Error('Expected JSON response but got something else');
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("about");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (typeof window === 'undefined') {
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        // Fetch current user info first
        const currentUserData = await fetchJSON("/api/profile", { headers });
        setCurrentUser(currentUserData);

        if (!userId) {
          // Own profile
          setIsOwnProfile(true);
          setProfile({
            id: currentUserData.id,
            firstName: currentUserData.first_name,
            lastName: currentUserData.last_name,
            email: currentUserData.email,
            nickname: currentUserData.nickname?.String || '',
            dateOfBirth: currentUserData.date_of_birth,
            aboutMe: currentUserData.about_me,
            avatarUrl: currentUserData.avatar?.replace('./uploads', '/uploads')
          });
          setPosts(currentUserData.posts || []);
          setPrivacy(currentUserData.is_public ? "public" : "private");
        } else {
          // Other user's profile
          const otherUserData = await fetchJSON(`/api/profile/${userId}`, { headers });
          console.log(otherUserData, "other data ");
          
          setIsOwnProfile(currentUserData.id === otherUserData.id);
          setProfile({
            id: otherUserData.id,
            firstName: otherUserData.first_name,
            lastName: otherUserData.last_name,
            email: otherUserData.email,
            nickname: otherUserData.nickname?.String || '',
            dateOfBirth: otherUserData.date_of_birth,
            aboutMe: otherUserData.about_me,
            avatarUrl: otherUserData.avatar?.replace('./uploads', '/uploads')
          });
          setPosts(otherUserData.posts || []);
          setPrivacy(otherUserData.is_public ? "public" : "private");

          // Check follow status
          try {
            // const followStatus = await fetchJSON(`/api/users/${userId}/follow-status`, { headers });
            // setIsFollowing(followStatus.isFollowing);
          } catch (followError) {
            console.warn("Could not fetch follow status:", followError);
            setIsFollowing(false);
          }
        }

        // TODO: Replace with actual API calls for followers and following
        setFollowers([]); 
        setFollowing([]);
        
      } catch (err) {
        if (err.message.includes('401')) {
          // Unauthorized
          localStorage.removeItem('token');
          localStorage.removeItem('isLoggedIn');
          router.replace('/login');
          return;
        }
        console.error("Error fetching profile:", err);
        setError(err.message || 'Failed to load profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, router]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage("Please log in to follow users");
        return;
      }

      const response = await fetch(`/api/users/${profile.id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setMessage(isFollowing ? "Unfollowed successfully!" : "Following successfully!");

        // Update followers count
        setFollowers(prev => 
          isFollowing 
            ? prev.filter(f => f.id !== currentUser.id)
            : [...prev, currentUser]
        );
      } else {
        throw new Error('Failed to update follow status');
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      setMessage("Failed to update follow status. Please try again later.");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const handleSendMessage = () => {
    router.push(`/chat?user=${profile.id}`);
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handlePrivacyToggle = async () => {
    if (!isOwnProfile) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage("Please log in to update privacy settings");
        return;
      }

      const newPrivacy = privacy === "public" ? "private" : "public";
      const response = await fetch("/api/privacy/update", {
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
        <p>We couldn't find this profile.</p>
        <button 
          className={styles.primaryButton}
          onClick={() => router.replace('/discover')}
        >
          Discover Users
        </button>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <img 
              src={profile.avatarUrl?.startsWith('http') ? profile.avatarUrl : '/default-avatar.jpg'} 
              alt="Profile" 
              className={styles.avatar}
              onError={(e) => e.target.src = '/default-avatar.jpg'}
            />
          </div>
          
          <div className={styles.profileInfo}>
            <h1 className={styles.userName}>
              {profile.nickname || `${profile.firstName} ${profile.lastName}`}
            </h1>
            <p className={styles.userEmail}>{profile.email}</p>
            <p className={styles.userBio}>{profile.aboutMe}</p>
          </div>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{followers.length}</span>
            <span className={styles.statLabel}>Followers</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{following.length}</span>
            <span className={styles.statLabel}>Following</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{posts.length}</span>
            <span className={styles.statLabel}>Posts</span>
          </div>
        </div>

        <div className={styles.actionButtons}>
          {isOwnProfile ? (
            <button 
              className={styles.editButton}
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
                onClick={handleFollow}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button 
                className={styles.messageButton}
                onClick={handleSendMessage}
              >
                Message
              </button>
            </>
          )}
        </div>

        {message && (
          <div className={`${styles.message} ${styles.fadeIn}`}>
            {message}
          </div>
        )}
      </div>

      <div className={styles.tabsContainer}>
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

        <div className={styles.tabContent}>
          {activeTab === 'about' && (
            <div className={styles.aboutContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Personal Information</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email:</span>
                    <span className={styles.infoValue}>{profile.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Birthday:</span>
                    <span className={styles.infoValue}>{profile.dateOfBirth || 'Not specified'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Nickname:</span>
                    <span className={styles.infoValue}>{profile.nickname || 'Not specified'}</span>
                  </div>
                  {isOwnProfile && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Privacy:</span>
                      <button 
                        className={styles.privacyToggle}
                        onClick={handlePrivacyToggle}
                      >
                        {privacy}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {profile.aboutMe && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>About Me</h2>
                  <p className={styles.aboutText}>{profile.aboutMe}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className={styles.postsContent}>
              {posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className={styles.postCard}>
                    <p className={styles.postContent}>{post.content}</p>
                    <div className={styles.postMeta}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>No posts yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'friends' && (
            <div className={styles.friendsContent}>
              <div className={styles.friendsSection}>
                <h3>Followers ({followers.length})</h3>
                <div className={styles.friendsGrid}>
                  {followers.length > 0 ? (
                    followers.map(follower => (
                      <div key={follower.id} className={styles.friendCard}>
                        <img src={follower.avatar || '/default-avatar.jpg'} alt={follower.nickname} />
                        <span>{follower.nickname || follower.email}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyState}>No followers yet</p>
                  )}
                </div>
              </div>
              
              <div className={styles.friendsSection}>
                <h3>Following ({following.length})</h3>
                <div className={styles.friendsGrid}>
                  {following.length > 0 ? (
                    following.map(follow => (
                      <div key={follow.id} className={styles.friendCard}>
                        <img src={follow.avatar || '/default-avatar.jpg'} alt={follow.nickname} />
                        <span>{follow.nickname || follow.email}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyState}>Not following anyone yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className={styles.photosContent}>
              <div className={styles.emptyState}>
                <p>No photos uploaded yet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
