import React, { useState } from "react";

export default function CreatePost() {
  const [form, setForm] = useState({
    content: "",
    image: null,
    privacy: "public"
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    const res = await fetch("/api/posts", {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      setMessage("Post created!");
    } else {
      setMessage("Failed to create post.");
    }
  };

  return (
    <div className="create-post">
      <h2>Create Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea name="content" placeholder="What's on your mind?" value={form.content} onChange={handleChange} required />
        <input name="image" type="file" accept="image/*,image/gif" onChange={handleChange} />
        <select name="privacy" value={form.privacy} onChange={handleChange}>
          <option value="public">Public</option>
          <option value="almost_private">Almost Private</option>
          <option value="private">Private</option>
        </select>
        <button type="submit">Post</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
