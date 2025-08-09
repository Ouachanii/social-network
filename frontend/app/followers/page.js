"use client";
import React, { useEffect, useState } from "react";
import styles from "./style.module.css";
import Link from "next/link";

export default function FollowersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [followingUsers, setFollowingUsers] = useState(new Set());

  // Mock data for demonstration
  const mockUsers = [

    { 
      id: 5, 
      nickname: "alexwilson", 
      email: "alex@example.com", 
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face", 
      bio: "Software architect and open source contributor", 
      followers: 3421, 
      following: 1023 
    },
    { 
      id: 7, 
      nickname: "rachelgreen", 
      email: "rachel@example.com", 
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face", 
      bio: "Marketing specialist and content creator", 
      followers: 945, 
      following: 312 
    }
  ];

  useEffect(() => {
    // Replace with actual API call
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
    
    // Real implementation:
    // fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("/api/users", {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await response.json();
      setUsers(data.users || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/follow/${userId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFollowingUsers(prev => new Set([...prev, userId]));
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, followers: user.followers + 1 }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async (userId) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/unfollow/${userId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, followers: Math.max(0, user.followers - 1) }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "following") {
      return matchesSearch && followingUsers.has(user.id);
    } else if (filter === "not-following") {
      return matchesSearch && !followingUsers.has(user.id);
    }
    
    return matchesSearch;
  });

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.iconContainer}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h1 className={styles.title}>Discover Users</h1>
              <p className={styles.subtitle}>Connect with amazing people in our community</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className={styles.searchFilterContainer}>
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search users by name, email, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>
            <div className={styles.filterContainer}>
              <div className={styles.filterWrapper}>
                <svg className={styles.filterIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
                </svg>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Users</option>
                  <option value="following">Following</option>
                  <option value="not-following">Not Following</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statNumber} ${styles.purple}`}>{users.length}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNumber} ${styles.blue}`}>{followingUsers.size}</div>
            <div className={styles.statLabel}>Following</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNumber} ${styles.green}`}>{filteredUsers.length}</div>
            <div className={styles.statLabel}>Filtered Results</div>
          </div>
        </div>

        {/* Users Grid */}
        <div className={styles.usersGrid}>
          {filteredUsers.map(user => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.cardContent}>
                {/* Avatar and Basic Info */}
                <div className={styles.userHeader}>
                  <div className={styles.avatarContainer}>
                    <Link href={`/profile/${user.id}`}>
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.nickname}&background=a855f7&color=fff&size=150`}
                      alt={user.nickname}
                      className={styles.avatar}
                    />
                    </Link>
                    {followingUsers.has(user.id) && (
                      <div className={styles.followingBadge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <polyline points="16,11 18,13 22,9"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <h3 className={styles.userName}>{user.nickname}</h3>
                    <p className={styles.userEmail}>{user.email}</p>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className={styles.bio}>{user.bio}</p>
                )}

                {/* Stats */}
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{formatNumber(user.followers)}</div>
                    <div className={styles.statName}>Followers</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{formatNumber(user.following)}</div>
                    <div className={styles.statName}>Following</div>
                  </div>
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => followingUsers.has(user.id) ? handleUnfollow(user.id) : handleFollow(user.id)}
                  className={`${styles.followButton} ${followingUsers.has(user.id) ? styles.following : styles.notFollowing}`}
                >
                  {followingUsers.has(user.id) ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <polyline points="16,11 18,13 22,9"/>
                      </svg>
                      Following
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M19 8v6"/>
                        <path d="M22 11h-6"/>
                      </svg>
                      Follow
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredUsers.length === 0 && (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 className={styles.noResultsTitle}>No users found</h3>
            <p className={styles.noResultsText}>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}