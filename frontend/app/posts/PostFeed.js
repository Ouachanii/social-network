"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/posts.module.css';

export function PostFeed() {
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPosts = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            const response = await fetch('http://localhost:8080/api/posts', {
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
                throw new Error('Failed to fetch posts');
            }

            const data = await response.json();
            console.log('Posts data:', data); // For debugging
            setPosts(data.posts || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setError('Failed to load posts. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [router]);

    const handleLike = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`http://localhost:8080/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to like post');
            }

            // Update post likes in the UI
            const updatedPosts = posts.map(post =>
                post.id === postId
                    ? { ...post, likes: [...(post.likes || []), { userId: 'currentUser' }] }
                    : post
            );
            setPosts(updatedPosts);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getPrivacyIcon = (privacy) => {
        switch (privacy) {
            case 'public': return '🌎';
            case 'almost_private': return '👥';
            case 'private': return '🔒';
            default: return '🌎';
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingSpinner}>
                <div className={styles.spinner} />
                Loading posts...
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorMessage}>
                {error}
                <button onClick={fetchPosts} className={styles.retryButton}>
                    Try Again
                </button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className={styles.emptyMessage}>
                No posts yet. Be the first to share something!
            </div>
        );
    }

    return (
        <div>
            {posts.map(post => (
                <article key={post.Pid} className={styles.post}>
                    <div className={styles.postHeader}>
                        <div className={styles.authorAvatar}>
                            {post.authorAvatar && (
                                <img
                                    src={post.Avatar ? `http://localhost:8080/${post.Avatar}` : '/default-avatar.png'}
                                    alt={post.Username}
                                    className={styles.authorAvatar}
                                />
                            )}
                        </div>
                        <div className={styles.authorInfo}>
                            <h3 className={styles.authorName}>{post.Username || 'Anonymous'}</h3>
                            <div className={styles.postMeta}>
                                <span className={styles.timestamp}>
                                    {formatDate(post.CreatedAt)}
                                </span>
                                <span className={styles.privacyIcon}>
                                    {getPrivacyIcon(post.Privacy)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.postContent}>
                        <p className={styles.postText}>{post.Content}</p>
                        {post.Image && (
                            <img
                                src={`http://localhost:8080/${post.Image}`}
                                alt="Post attachment"
                                className={styles.postImage}
                            />
                        )}
                    </div>

                    <div className={styles.postActions}>
                        <button
                            className={`${styles.actionButton} ${post.UserInteraction === 1 ? styles.liked : ''}`}
                            onClick={() => handleLike(post.Pid)}
                            aria-label="Like"
                        >
                            <span className={styles.actionIcon}>
                                👍
                            </span>
                            <span className={styles.actionText}>
                                {post.Likes || 0}
                            </span>
                        </button>

                        <button
                            className={styles.actionButton}
                            aria-label="Dislike"
                        >
                            <span className={styles.actionIcon}>👎</span>
                            <span className={styles.actionText}>Dislike</span>
                        </button>

                        <button
                            className={styles.actionButton}
                            aria-label="Comment"
                        >
                            <span className={styles.actionIcon}>💬</span>
                            <span className={styles.actionText}>Comment</span>
                        </button>
                    </div>

                </article>
            ))}
        </div>
    );
}
