import React, { useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch profile info
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile);
        setPosts(data.posts);
        setFollowers(data.followers);
        setFollowing(data.following);
        setPrivacy(data.privacy);
      });
  }, []);

  const handlePrivacyToggle = async () => {
    const newPrivacy = privacy === "public" ? "private" : "public";
    const res = await fetch("/api/privacy/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privacy: newPrivacy })
    });
    if (res.ok) {
      setPrivacy(newPrivacy);
      setMessage("Privacy updated!");
    } else {
      setMessage("Failed to update privacy.");
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      <h2>Profile</h2>
      <img src={profile.avatarUrl} alt="Avatar" width={100} height={100} />
      <p><b>Name:</b> {profile.firstName} {profile.lastName}</p>
      <p><b>Email:</b> {profile.email}</p>
      <p><b>Date of Birth:</b> {profile.dateOfBirth}</p>
      <p><b>Nickname:</b> {profile.nickname}</p>
      <p><b>About Me:</b> {profile.aboutMe}</p>
      <button onClick={handlePrivacyToggle}>
        Set Profile {privacy === "public" ? "Private" : "Public"}
      </button>
      {message && <p>{message}</p>}
      <h3>Followers ({followers.length})</h3>
      <ul>{followers.map(f => <li key={f.id}>{f.nickname || f.email}</li>)}</ul>
      <h3>Following ({following.length})</h3>
      <ul>{following.map(f => <li key={f.id}>{f.nickname || f.email}</li>)}</ul>
      <h3>Posts</h3>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <p>{post.content}</p>
            {post.imageUrl && <img src={post.imageUrl} alt="Post" width={200} />}
            <p>Privacy: {post.privacy}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
