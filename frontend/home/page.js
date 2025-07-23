"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // Fetch data with JWT cookie (it will be sent automatically)
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        const [postsRes, usersRes, groupsRes] = await Promise.all([
          fetch("/api/posts", { headers }),
          fetch("/api/users", { headers }),
          fetch("/api/groups", { headers })
        ]);

        if (!postsRes.ok || !usersRes.ok || !groupsRes.ok) {
          // If any request fails due to auth, redirect to login
          localStorage.removeItem("isLoggedIn");
          router.replace("/login");
          return;
        }

        const [postsData, usersData, groupsData] = await Promise.all([
          postsRes.json(),
          usersRes.json(),
          groupsRes.json()
        ]);

        setPosts(postsData.posts || []);
        setUsers(usersData.users || []);
        setGroups(groupsData.groups || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        router.replace("/login");
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="home-page">
      <h2>Home</h2>
      <section>
        <h3>Posts</h3>
        <ul>{posts.map(post => (
          <li key={post.id}>{post.content}</li>
        ))}</ul>
      </section>
      <section>
        <h3>Users</h3>
        <ul>{users.map(user => (
          <li key={user.id}>{user.nickname || user.email}</li>
        ))}</ul>
      </section>
      <section>
        <h3>Groups</h3>
        <ul>{groups.map(group => (
          <li key={group.id}>{group.title}</li>
        ))}</ul>
      </section>
    </div>
  );
}
