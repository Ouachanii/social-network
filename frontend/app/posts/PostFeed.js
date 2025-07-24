import React, { useEffect, useState } from "react";

export default function PostFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data.posts));
  }, []);

  return (
    <div className="post-feed">
      <h2>Feed</h2>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <p>{post.content}</p>
            {post.imageUrl && <img src={post.imageUrl} alt="Post" width={200} />}
            <p>Privacy: {post.privacy}</p>
            {/* Comments and like buttons can be added here */}
          </li>
        ))}
      </ul>
    </div>
  );
}
