'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '../../styles/profile.module.css';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendsDataLoaded, setFriendsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshPosts, setRefreshPosts] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        fetchUserPosts();
        fetchFriendsData();
      } else if (response.status === 403) {
        setError('This profile is private. You need to follow this user to view their profile.');
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/posts/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchFriendsData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const countsResponse = await fetch(`/api/friends/counts/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (countsResponse.ok) {
        const counts = await countsResponse.json();
        setFollowersCount(counts.followers);
        setFollowingCount(counts.following);
      }

      const followersResponse = await fetch(`/api/friends/followers/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        setFollowers(followersData);
      }

      const followingResponse = await fetch(`/api/friends/following/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
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
        <div className={styles.errorIcon}>
          <i className="fa-solid fa-exclamation-triangle"></i>
        </div>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <i className="fa-solid fa-user-slash"></i>
        </div>
        <h2>Profile Not Found</h2>
        <p>This user profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* Cover Photo */}
      <div className={styles.coverPhoto}>
        {/* Cover photo placeholder */}
      </div>

      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              {profile.avatar ? (
                <img 
                  src={`http://localhost:8080/uploads/avatars/${profile.avatar.split('/').pop()}`} 
                  alt="Profile" 
                />
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </div>
          </div>
        </div>

        <div className={styles.profileInfo}>
          <h1 className={styles.name}>
            {profile.first_name} {profile.last_name}
          </h1>
          <div className={styles.stats}>
            {posts ? posts.length : 0} posts · {followersCount || 0} followers · {followingCount || 0} following
          </div>
        </div>
      </div>

      {/* Navigation */}
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

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'posts' && (
          <>
            <div className={styles.postsList}>
              {posts && posts.length > 0 ? (
                posts.map((post, index) => (
                  <div key={post.id || `post-${index}`} className={styles.postItem}>
                    <div className={styles.postHeader}>
                      <div className={styles.postAuthor}>
                        <span className={styles.authorName}>
                          {profile.first_name} {profile.last_name}
                        </span>
                        <span className={styles.postDate}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={styles.postContent}>
                      <p>{post.content}</p>
                      {post.image && (
                        <img 
                          src={`http://localhost:8080/uploads/posts/${post.image.split('/').pop()}`} 
                          alt="Post" 
                          className={styles.postImage}
                        />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyMessage}>
                  <i className="fa-solid fa-newspaper"></i>
                  <p>No posts yet.</p>
                </div>
              )}
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
                    <span className={styles.aboutLabel}>Date of Birth</span>
                    <span className={styles.aboutValue}>
                      {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                </div>
                {profile.nickname && profile.nickname.String && (
                  <div className={styles.aboutItem}>
                    <div className={styles.aboutIcon}>
                      <i className="fa-solid fa-at"></i>
                    </div>
                    <div className={styles.aboutContent}>
                      <span className={styles.aboutLabel}>Nickname</span>
                      <span className={styles.aboutValue}>@{profile.nickname.String}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {profile.about_me && (
                <div className={styles.aboutMeContent}>
                  <h3>About Me</h3>
                  <p className={styles.aboutMeText}>{profile.about_me}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
