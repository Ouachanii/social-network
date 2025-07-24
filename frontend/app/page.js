"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "./components/logout_button";
import { CreatePost } from "./components/create_post";


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
    <div className="home-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <h1>Social Network</h1>
        <LogoutButton />
      </header>
      
      <main style={{ padding: '1rem' }}>
        <CreatePost onPostCreated={handlePostCreated} />
        
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <section>
              <h3>Posts</h3>
              {posts && posts.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {posts.map(post => (
                    <li key={post.id || Math.random()} style={{ 
                      marginBottom: '1rem',
                      padding: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        {post.image && (
                          <img 
                            src={`http://localhost:8080/${post.image}`} 
                            alt="Post image"
                            style={{ maxWidth: '100%', marginBottom: '0.5rem' }}
                          />
                        )}
                        <p>{post.content}</p>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Posted by: {post.username || 'Anonymous'}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No posts available</p>
              )}
            </section>
            
            <section>
              <h3>Groups</h3>
              {groups && groups.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {groups.map(group => (
                    <li key={group.id || Math.random()} style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}>
                      <h4>{group.title}</h4>
                      <p>{group.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No groups available</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}