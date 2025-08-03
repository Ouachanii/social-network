"use client";
import React, { useEffect } from "react";
import { useRouter } from 'next/navigation';

// This page acts as a redirector.
// It fetches the logged-in user's ID and then redirects to their dynamic profile page /u/[userID]
export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndRedirect = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        // Note: Fetching from /api/profile/ without an ID defaults to the logged-in user.
        const response = await fetch("http://localhost:8080/api/profile/", {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          router.replace('/login');
          return;
        }

        const data = await response.json();
        if (data && data.id) {
          router.replace(`/u/${data.id}`);
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error("Error fetching user ID for redirect:", error);
        router.replace('/login');
      }
    };

    fetchUserAndRedirect();
  }, [router]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Finding your profile...</p>
    </div>
  );
}
