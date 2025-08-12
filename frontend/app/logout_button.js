'use client';

import { useRouter } from 'next/navigation';
import { useUser } from './context/UserContext';

export function LogoutButton() {
  const router = useRouter();
  const { setUser } = useUser();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });

      if (response.ok) {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return <button onClick={handleLogout}>
    <i className="fa-solid fa-right-from-bracket"></i>
  </button>;
}
