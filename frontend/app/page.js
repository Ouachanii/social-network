"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./context/UserContext";
import { LogoutButton } from "./logout_button";
import { CreatePost } from "./posts/create_post";
import { PostFeed } from "./posts/PostFeed";
import Link from "next/link";
import styles from "./styles/home.module.css";


export default function HomePage() {
  const [groups, setGroups] = useState([]);
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        router.replace("/login");
        return;
      }

      const response = await fetch("http://localhost:8080/api/groups", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        throw new Error("Failed to fetch groups");
      }

      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    fetchGroups();
  }, [router]);

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
          <Link href="/users" className={styles.sidebarItem}>
            <div className={styles.sidebarIcon}>🌐</div>
            <span>Users</span>
          </Link>
          <Link href="/groups" className={styles.sidebarItem}>
            <div className={styles.sidebarIcon}>
              <img src="/group-avatar.png" className={styles.sidebarIcon}/>
            </div>
            <span>Groups</span>
          </Link>
          <Link href="/notifications" className={styles.sidebarItem}>
            <div className={styles.sidebarIcon}>🔔</div>
            <span>Notifications</span>
          </Link>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <CreatePost 
            onPostCreated={() => {}} 
            avatarUrl={user && user.avatar ? `http://localhost:8080/${user.avatar}` : '/default-avatar.jpg'}
          />
          <PostFeed />
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
