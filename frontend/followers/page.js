import React, { useEffect, useState } from "react";

export default function FollowersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users));
  }, []);

  const handleFollow = async (userId) => {
    await fetch(`/api/follow/${userId}`, { method: "POST" });
    // Optionally refresh list
  };

  return (
    <div className="followers-page">
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.nickname || user.email}
            <button onClick={() => handleFollow(user.id)}>Follow</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
