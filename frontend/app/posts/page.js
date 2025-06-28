"use client";
import { useState, useEffect } from "react";

export default function Posts() {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const [privacy, setPrivacy] = useState("public");
    const [image, setImage] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch posts on mount
    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8080/api/posts", {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch posts");
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("content", content);
            formData.append("privacy", privacy);
            if (image) formData.append("image", image);
            const res = await fetch("http://localhost:8080/api/posts", {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            if (!res.ok) throw new Error("Failed to create post");
            setContent("");
            setPrivacy("public");
            setImage(null);
            fetchPosts();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
            <h1>Posts</h1>
            <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
                <textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={3}
                    style={{ width: "100%", marginBottom: 8 }}
                />
                <div style={{ marginBottom: 8 }}>
                    <select value={privacy} onChange={e => setPrivacy(e.target.value)}>
                        <option value="public">Public</option>
                        <option value="almost_private">Followers Only</option>
                        <option value="private">Selected Followers</option>
                    </select>
                </div>
                <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} />
                <button type="submit" disabled={loading} style={{ marginLeft: 8 }}>
                    {loading ? "Posting..." : "Post"}
                </button>
            </form>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <div>
                {posts.length === 0 && <div>No posts yet.</div>}
                {posts.map(post => (
                    <div key={post.Pid} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                        <div style={{ fontWeight: "bold" }}>{post.Username}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{post.CreatedAt}</div>
                        <div style={{ margin: "8px 0" }}>{post.Content}</div>
                        {post.Image && <img src={post.Image.replace(/^uploads/, "http://localhost:8080/uploads")} alt="post" style={{ maxWidth: "100%", maxHeight: 300 }} />}
                        <div style={{ fontSize: 12, color: "#888" }}>Privacy: {post.Privacy}</div>
                    </div>
                ))}
            </div>
        </main>
    );
}
