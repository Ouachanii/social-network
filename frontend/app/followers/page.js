"use client";
import React, { useEffect, useState } from "react";

export default function FollowersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // This endpoint doesn't seem to exist in server.go, this is placeholder logic
    // fetch("/api/users")
    //   .then((res) => res.json())
    //   .then((data) => setUsers(data.users));
  }, []);

  const handleFollow = async (userId) => {
    // This endpoint requires an Authorization header
    const token = localStorage.getItem('token');
    await fetch(`/api/follow/${userId}`, { 
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
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
