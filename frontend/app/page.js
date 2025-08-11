"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreatePost } from "./posts/create_post";
import { PostFeed } from "./posts/PostFeed";
import UserProfile from "./components/UserProfile";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Basic auth check
    const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="main-post" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '20px', padding: '20px' }}>
      <div style={{ maxWidth: '680px', flex: 1 }}>
        <CreatePost onPostCreated={() => { }} />
        <PostFeed />
      </div>
      <div style={{ width: '250px' }}>
        <UserProfile />
      </div>
    </div>

  );
}
