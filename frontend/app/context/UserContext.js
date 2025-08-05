'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/user', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const value = { user, setUser, loading };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
