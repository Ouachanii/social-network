import React, { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications));
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
