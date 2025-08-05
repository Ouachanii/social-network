"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreatePost } from "./posts/create_post";
import { PostFeed } from "./posts/PostFeed";

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
    <div style={{ maxWidth: '680px', margin: '20px auto' }}>
      <CreatePost onPostCreated={() => {}} />
      <PostFeed />
    </div>
  );
}
