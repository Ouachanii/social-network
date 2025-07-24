import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch("http://localhost:8080/api/notifications", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch notifications');
        }
        return res.json();
      })
      .then((data) => setNotifications(data.notifications))
      .catch((error) => {
        console.error('Error fetching notifications:', error);
        if (error.message === 'Unauthorized') {
          router.replace("/login");
        }
      });
  }, []);

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      <ul>
        {notifications.map(n => (
          <li key={n.id}>{n.message}</li>
        ))}
      </ul>
    </div>
  );
}
