"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "./components/logout_button";
import { CreatePost } from "./components/create_post";
import Link from "next/link";
import styles from "./styles/home.module.css";


export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        router.replace("/login");
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [postsRes, groupsRes] = await Promise.all([
        fetch("http://localhost:8080/api/posts", { 
          headers,
          credentials: 'include'
        }),
        fetch("http://localhost:8080/api/groups", { 
          headers,
          credentials: 'include'
        })
      ]);

      if (!postsRes.ok || !groupsRes.ok) {
        if (postsRes.status === 401 || groupsRes.status === 401) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const [postsData, groupsData] = await Promise.all([
        postsRes.json(),
        groupsRes.json()
      ]);

      setPosts(postsData?.posts || []);
      setGroups(groupsData?.groups || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      setPosts([]);
      setGroups([]);
      if (error.message === 'Unauthorized') {
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    fetchData();
  }, [router]);

  const handlePostCreated = () => {
    fetchData(); // Refresh posts after creating a new one
  };

  return (
    <div>
      <header className={styles.header}>
        <h1>Social Network</h1>
        <LogoutButton />
      </header>
      
      <div className={styles.container}>
        {/* Left Sidebar */}
        <aside className={styles.leftSidebar}>
          <Link href="/profile" className={styles.sidebarItem}>
            <div className={styles.sidebarIcon}>👤</div>
            <span>Profile</span>
          </Link>
          <Link href="/friends" className={styles.sidebarItem}>
            <div className={styles.sidebarIcon}>👥</div>
            <span>Friends</span>
          </Link>
          <Link href="/groups" className={styles.sidebarItem}>
            <div className={styles.sidebarIcon}>👥</div>
            <span>Groups</span>
          </Link>
          <Link href="/notifications" className={styles.sidebarItem}>
            <div className={styles.sidebarIcon}>🔔</div>
            <span>Notifications</span>
          </Link>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <CreatePost onPostCreated={handlePostCreated} />
          
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              {/* Posts Feed */}
              <section>
                {posts && posts.length > 0 ? (
                  posts.map(post => (
                    <article key={post.id || Math.random()} className={styles.post}>
                      <div className={styles.postHeader}>
                        <div className={styles.postUserAvatar}></div>
                        <div className={styles.postUserInfo}>
                          <p className={styles.postUsername}>{post.username || 'Anonymous'}</p>
                          <p className={styles.postTimestamp}>Just now</p>
                        </div>
                      </div>

                      <div className={styles.postContent}>
                        <p>{post.content}</p>
                        {post.image && (
                          <img
                            src={`http://localhost:8080/${post.image}`}
                            alt="Post image"
                            className={styles.postImage}
                          />
                        )}
                      </div>

                      <div className={styles.postActions}>
                        <button className={styles.actionButton}>
                          👍 Like
                        </button>
                        <button className={styles.actionButton}>
                          💬 Comment
                        </button>
                        <button className={styles.actionButton}>
                          ↗️ Share
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p>No posts available</p>
                )}
              </section>
            </>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className={styles.rightSidebar}>
          <h3 className={styles.sectionTitle}>Your Groups</h3>
          {groups && groups.length > 0 ? (
            groups.map(group => (
              <div key={group.id || Math.random()} className={styles.group}>
                <h4 className={styles.groupTitle}>{group.title}</h4>
                <p className={styles.groupDescription}>{group.description}</p>
              </div>
            ))
          ) : (
            <p>No groups available</p>
          )}
        </aside>
      </div>
    </div>
  );
}