"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "../styles/groups.module.css";

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }

        const response = await fetch("http://localhost:8080/api/groups", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            router.replace('/login');
            return;
          }
          throw new Error('Failed to fetch groups');
        }

        const data = await response.json();
        setGroups(data.groups || []);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setMessage({ type: 'error', text: 'Failed to load groups. Please try again later.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [router]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch("http://localhost:8080/api/groups", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ title, description })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('isLoggedIn');
          router.replace('/login');
          return;
        }
        throw new Error('Failed to create group');
      }

      const newGroup = await response.json();
      setGroups(prev => [...prev, newGroup]);
      setTitle("");
      setDescription("");
      setMessage({ type: 'success', text: 'Group created successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error("Error creating group:", error);
      setMessage({ type: 'error', text: 'Failed to create group. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading groups...</p>
      </div>
    );
  }

  return (
    <div className={styles.groupsContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Groups</h1>
      </div>

      <form className={styles.createForm} onSubmit={handleCreate}>
        <h2 className={styles.formTitle}>Create New Group</h2>
        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="title">Group Name</label>
          <input
            id="title"
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter group name"
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="description">Description</label>
          <input
            id="description"
            className={styles.input}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter group description"
            required
          />
        </div>
        <button 
          type="submit" 
          className={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Group'}
        </button>
      </form>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {groups.length > 0 ? (
        <ul className={styles.groupsList}>
          {groups.map(group => (
            <li key={group.id} className={styles.groupCard}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <p className={styles.groupDesc}>{group.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No groups available. Create one to get started!</p>
      )}
    </div>
  );
}
