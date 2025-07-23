import React, { useEffect, useState } from "react";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then((data) => setGroups(data.groups));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, desc })
    });
    if (res.ok) {
      setMessage("Group created!");
    } else {
      setMessage("Failed to create group.");
    }
  };

  return (
    <div className="groups-page">
      <h2>Groups</h2>
      <form onSubmit={handleCreate}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" required />
        <button type="submit">Create Group</button>
      </form>
      {message && <p>{message}</p>}
      <ul>
        {groups.map(group => (
          <li key={group.id}>{group.title} - {group.desc}</li>
        ))}
      </ul>
    </div>
  );
}
