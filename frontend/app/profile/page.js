"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "../styles/profile.module.css";
import { CreatePost } from "../posts/create_post";
import { ProfilePostFeed } from "../posts/ProfilePostFeed";
import { useUser } from "../context/UserContext";
import { getAvatarUrl, hasAvatar } from "../utils/avatarUtils";



export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendsDataLoaded, setFriendsDataLoaded] = useState(false);

  const [privacy, setPrivacy] = useState("public");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [refreshPosts, setRefreshPosts] = useState(0);
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [aboutMeText, setAboutMeText] = useState('');
  const [postsCount, setPostsCount] = useState(0);

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

        const response = await fetch("/api/profile", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        const responseText = await response.text();

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            router.replace('/login');
            return;
          }
          throw new Error(`Server error: ${response.status}\nResponse: ${responseText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
        
        if (!data) {
          throw new Error('Profile data not found');
        }

        setProfile({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          nickname: data.nickname?.String || '',
          dateOfBirth: data.date_of_birth,
          aboutMe: data.about_me,
          avatarUrl: hasAvatar(data.avatar) ? getAvatarUrl(data.avatar) : null
        });
                setAboutMeText(data.about_me || '');
        setPostsCount(data.posts_count || 0);
        
        window.dispatchEvent(new CustomEvent('userLoaded', { detail: data }));
        setPosts(data.posts || []);
        
        // Fetch friends data
        fetchFriendsData();

        setPrivacy(data.is_public ? "public" : "private");
        setError(null);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(error.message || 'Failed to load profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, []);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Invalid file type. Please use JPEG, PNG, or GIF.");
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      setMessage("File too large. Maximum size is 1MB.");
      return;
    }

    setIsUploadingAvatar(true);
    setMessage("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage("Please log in to update avatar");
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      // console.log('Uploading avatar...', { file: file.name, size: file.size });

      const response = await fetch('/api/update-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

              // console.log('Response status:', response.status);
        // console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Failed to update avatar';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          console.error('Error parsing response:', e);
          // If we can't parse JSON, it might be HTML (error page)
          const text = await response.text();
          console.error('Response text:', text.substring(0, 500));
          errorMessage = 'Server error - received HTML instead of JSON';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
              // console.log('Upload response:', data);
      
      setMessage("Avatar updated successfully!");
      
      // Update the profile state with new avatar
      setProfile(prev => ({
        ...prev,
        avatarUrl: data.avatar
      }));

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);

      // Trigger a page refresh to update the header
      window.location.reload();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage(error.message || 'Failed to update avatar');
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePrivacyToggle = async () => {
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
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSaveAboutMe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage("Please log in to update about me");
        return;
      }

      const response = await fetch("/api/profile/about-me", {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': "application/json" 
        },
        body: JSON.stringify({ about_me: aboutMeText })
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

      setProfile(prev => ({ ...prev, aboutMe: aboutMeText }));
      setIsEditingAboutMe(false);
      setMessage("About me updated successfully!");
    } catch (error) {
      console.error("Error updating about me:", error);
      setMessage("Failed to update about me. Please try again later.");
    }
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(""), 3000);
  };

  // Fetch friends data (followers and following)
  const fetchFriendsData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch counts
      const countsResponse = await fetch('/api/friends/counts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (countsResponse.ok) {
        const counts = await countsResponse.json();
        setFollowersCount(counts.followers);
        setFollowingCount(counts.following);
      }

      // Fetch followers list
      const followersResponse = await fetch('/api/friends/followers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        setFollowers(followersData);
      }

      // Fetch following list
      const followingResponse = await fetch('/api/friends/following', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        setFollowing(followingData);
      }
      
      setFriendsDataLoaded(true);
    } catch (error) {
      console.error('Error fetching friends data:', error);
      setFriendsDataLoaded(true);
    }
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
          <div className={styles.avatarContainer}>
            <img 
              src={profile.avatarUrl || '/default-avatar.jpg'} 
              alt="Profile" 
              className={styles.avatar}
              onError={(e) => {
                e.target.src = '/default-avatar.jpg';
              }}
            />
            <div className={styles.avatarUpload}>
              <input
                type="file"
                id="avatar-upload"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="avatar-upload" className={styles.uploadButton}>
                {isUploadingAvatar ? 'Uploading...' : '📷'}
              </label>
            </div>
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{String(profile.firstName || '')} {String(profile.lastName || '')}</h1>
            <div className={styles.stats}>
              {postsCount} posts · {followersCount} followers · {followingCount} following
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handlePrivacyToggle}>
                {privacy === "public" ? "Make Private" : "Make Public"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.navigation}>
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
          className={`${styles.navItem} ${activeTab === 'about' ? styles.active : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </div>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.content}>
        {activeTab === 'posts' && (
          <>
            {/* Create Post Component */}
            <div className={styles.createPostSection}>
              <CreatePost 
                onPostCreated={() => {
                  // Refresh posts after creating a new one
                  fetchProfile();
                  // Force ProfilePostFeed to re-render
                  setRefreshPosts(prev => prev + 1);
                  // Update posts count
                  setPostsCount(prev => prev + 1);
                }}
                user={user}
              />
            </div>

            {/* Display Posts */}
            <div className={styles.postsList}>
              <ProfilePostFeed key={refreshPosts} />
            </div>
          </>
        )}

        {activeTab === 'friends' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Friends</h2>
            {!friendsDataLoaded ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading friends...</p>
              </div>
            ) : (
              <div className={styles.friendsGrid}>
              <div className={styles.friendsColumn}>
                <h3>Followers ({followersCount})</h3>
                {followers && followers.length > 0 ? (
                  <div className={styles.friendsList}>
                    {followers.map(follower => (
                      <div key={follower.id} className={styles.friendItem} onClick={() => router.push(`/profile/${follower.id}`)}>
                        <div className={styles.friendAvatar}>
                          {follower.avatar ? (
                            <img 
                              src={`http://localhost:8080/uploads/avatars/${follower.avatar.split('/').pop()}`} 
                              alt="Avatar" 
                            />
                          ) : (
                            <div className={styles.defaultFriendAvatar}></div>
                          )}
                        </div>
                        <div className={styles.friendInfo}>
                          <span className={styles.friendName}>
                            {follower.fname} {follower.lname}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyMessage}>No followers yet.</p>
                )}
              </div>
              <div className={styles.friendsColumn}>
                <h3>Following ({followingCount})</h3>
                {following && following.length > 0 ? (
                  <div className={styles.friendsList}>
                    {following.map(follow => (
                      <div key={follow.id} className={styles.friendItem} onClick={() => router.push(`/profile/${follow.id}`)}>
                        <div className={styles.friendAvatar}>
                          {follow.avatar ? (
                            <img 
                              src={`http://localhost:8080/uploads/avatars/${follow.avatar.split('/').pop()}`} 
                              alt="Avatar" 
                            />
                          ) : (
                            <div className={styles.defaultFriendAvatar}></div>
                          )}
                        </div>
                        <div className={styles.friendInfo}>
                          <span className={styles.friendName}>
                            {follow.fname} {follow.lname}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyMessage}>Not following anyone yet.</p>
                )}
              </div>
            </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <>
            <div className={styles.aboutSection}>
              <h2 className={styles.aboutTitle}>About</h2>
              <div className={styles.aboutGrid}>
                <div className={styles.aboutItem}>
                  <div className={styles.aboutIcon}>
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div className={styles.aboutContent}>
                    <span className={styles.aboutLabel}>Email</span>
                    <span className={styles.aboutValue}>{String(profile.email || '')}</span>
                  </div>
                </div>
                <div className={styles.aboutItem}>
                  <div className={styles.aboutIcon}>
                    <i className="fa-solid fa-cake-candles"></i>
                  </div>
                  <div className={styles.aboutContent}>
                    <span className={styles.aboutLabel}>Birthday</span>
                    <span className={styles.aboutValue}>{String(profile.dateOfBirth || '')}</span>
                  </div>
                </div>
                <div className={styles.aboutItem}>
                  <div className={styles.aboutIcon}>
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div className={styles.aboutContent}>
                    <span className={styles.aboutLabel}>Nickname</span>
                    <span className={styles.aboutValue}>{String(profile.nickname || '')}</span>
                  </div>
                </div>
                <div className={styles.aboutItem}>
                  <div className={styles.aboutIcon}>
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <div className={styles.aboutContent}>
                    <span className={styles.aboutLabel}>Privacy</span>
                    <span className={styles.aboutValue}>{String(privacy || 'public')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.aboutSection}>
              <div className={styles.aboutHeader}>
                <h2 className={styles.aboutTitle}>About Me</h2>
                <button 
                  className={styles.editButton}
                  onClick={() => setIsEditingAboutMe(!isEditingAboutMe)}
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
              </div>
              
              {isEditingAboutMe ? (
                <div className={styles.editAboutMe}>
                  <textarea
                    value={aboutMeText}
                    onChange={(e) => setAboutMeText(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className={styles.aboutTextarea}
                    maxLength={500}
                  />
                  <div className={styles.editActions}>
                    <button 
                      className={styles.saveButton}
                      onClick={handleSaveAboutMe}
                    >
                      Save
                    </button>
                    <button 
                      className={styles.cancelButton}
                      onClick={() => {
                        setIsEditingAboutMe(false);
                        setAboutMeText(profile.aboutMe || '');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.aboutMeContent}>
                  {profile.aboutMe ? (
                    <p className={styles.aboutMeText}>{profile.aboutMe}</p>
                  ) : (
                    <div className={styles.emptyAboutMe}>
                      <i className="fa-solid fa-plus"></i>
                      <p>Add something about yourself</p>
                      <button 
                        className={styles.addAboutMeButton}
                        onClick={() => setIsEditingAboutMe(true)}
                      >
                        Add About Me
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
