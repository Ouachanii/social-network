"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from "../styles/users.module.css";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/api/users", {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className={styles.usersContainer}>
      <h1>All Users</h1>
      <div className={styles.usersList}>
        {users.map(user => (
          <Link href={`/u/${user.ID}`} key={user.ID} className={styles.userCard}>
            <img 
              src={user.Avatar ? `http://localhost:8080/${user.Avatar}` : '/default-avatar.jpg'} 
              alt={`${user.Firstname}'s avatar`}
              className={styles.userAvatar}
            />
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user.Firstname} {user.Lastname}</p>
              <p className={styles.userNickname}>@{user.Nickname}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
