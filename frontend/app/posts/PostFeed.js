"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/posts.module.css';
import { CommentSection } from './CommentSection';

export function formatDate(dateString) {
        const fixedDateStr = dateString.replace(' at ', ' ');
        const date = new Date(fixedDateStr);

        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', fixedDateStr);
            return 'Invalid date';
        }

        const now = Date.now();
        const diff = now - (date.getTime() + 1000 * 60 * 60);

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) return "just now";
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        if (weeks < 4) return `${weeks}w`;
        if (months < 12) return `${months}mo`;
        return `${years}y`;
    };

export function PostFeed({ groupId, initialPosts }) {
    const router = useRouter();
    const [posts, setPosts] = useState(initialPosts || []);
    const [isLoading, setIsLoading] = useState(!initialPosts);
    const [error, setError] = useState(null);
    const [showComments, setShowComments] = useState({});
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const isLoadingRef = useRef(false);

    const fetchPosts = useCallback(async (loadMore = false) => {
        if (loadMore && isLoadingRef.current) return;
        
        if (loadMore) {
            setIsLoadingMore(true);
            isLoadingRef.current = true;
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            const currentOffset = loadMore ? offset : 0;
            const url = groupId 
                ? `http://localhost:8080/api/posts?group_id=${groupId}&offset=${currentOffset}`
                : `http://localhost:8080/api/posts?offset=${currentOffset}`;
                
            const response = await fetch(url, {
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
            const newPosts = data.posts || [];
            
            if (loadMore) {
                // Filter out any duplicate posts that might already exist
                const existingPostIds = new Set(posts.map(post => post.Pid));
                const uniqueNewPosts = newPosts.filter(post => !existingPostIds.has(post.Pid));
                
                setPosts(prevPosts => [...prevPosts, ...uniqueNewPosts]);
                setOffset(prevOffset => prevOffset + 10);
            } else {
                setPosts(newPosts);
                setOffset(10);
            }
            
            // Check if we have more posts to load
            setHasMore(newPosts.length === 10);
            
            // If we got fewer posts than requested, we've reached the end
            if (newPosts.length < 10) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            setError('Failed to load posts. Please try again later.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            isLoadingRef.current = false;
        }
    }, [router, offset, posts, groupId]);

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        if (isLoadingRef.current || !hasMore || initialPosts) return; // Do not fetch more if posts are passed as a prop

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when user is near the bottom (within 100px)
        if (scrollTop + windowHeight >= documentHeight - 100) {
            fetchPosts(true);
        }
    }, [hasMore, fetchPosts]);

    useEffect(() => {
        if (!initialPosts) {
            fetchPosts();
        }
    }, [router, initialPosts]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleInteraction = async (postId, interaction) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`http://localhost:8080/api/posts/${postId}/interact`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ interaction }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to update interaction');
            }

            const data = await response.json();

            // update the specific post with new data
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.Pid === postId
                        ? {
                            ...post,
                            Likes: data.post.Likes,
                            Dislikes: data.post.Dislikes,
                            UserInteraction: data.post.UserInteraction
                        }
                        : post
                )
            );
        } catch (error) {
            console.error('Error updating interaction:', error);
        }
    };

    const handleLike = (postId) => {
        const currentPost = posts.find(p => p.Pid === postId);
        const currentInteraction = currentPost?.UserInteraction || 0;

        // if already liked remove like (set to 0)  esle (set to 1)
        const newInteraction = currentInteraction === 1 ? 0 : 1;
        handleInteraction(postId, newInteraction);
    };

    const handleDislike = (postId) => {
        const currentPost = posts.find(p => p.Pid === postId);
        const currentInteraction = currentPost?.UserInteraction || 0;

        // if already disliked remove dislike (set to 0)  else (set to -1)
        const newInteraction = currentInteraction === -1 ? 0 : -1;
        handleInteraction(postId, newInteraction);
    };

    const toggleComments = (postId) => {
        setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const handleCommentAdded = (postId) => {
        // update post comment count
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.Pid === postId
                    ? { ...post, NbComment: (post.NbComment || 0) + 1 }
                    : post
            )
        );
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
            {posts.map((post, index) => (
                <article key={`${post.Pid}-${index}`} className={styles.post}>
                    <div className={styles.postHeader}>
                        <div className={styles.authorAvatar}>
                            <img
                                src={post.Avatar ? `http://localhost:8080/${post.Avatar}` : '/default-avatar.jpg'}
                                alt={post.Username}
                                className={styles.authorAvatar}
                                onError={(e) => {
                                    console.log('Avatar image failed to load:', post.Avatar);
                                }}
                            />
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
                                onError={(e) => {
                                    console.log('Post image failed to load:', post.Image);
                                    e.target.style.display = 'none';
                                }}
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
                            className={`${styles.actionButton} ${post.UserInteraction === -1 ? styles.disliked : ''}`}
                            onClick={() => handleDislike(post.Pid)}
                            aria-label="Dislike"
                        >
                            <span className={styles.actionIcon}>👎</span>
                            <span className={styles.actionText}>
                                {post.Dislikes || 0}
                            </span>
                        </button>

                        <button
                            className={styles.actionButton}
                            onClick={() => toggleComments(post.Pid)}
                            aria-label="Comment"
                        >
                            <span className={styles.actionIcon}>💬</span>
                            <span className={styles.actionText}>
                                {post.NbComment || 0}
                            </span>
                        </button>
                    </div>

                    {showComments[post.Pid] && (
                        <CommentSection
                            postId={post.Pid}
                            onCommentAdded={() => handleCommentAdded(post.Pid)}
                        />
                    )}
                </article>
            ))}
            
            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
                <div className={styles.loadingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Loading more posts...</span>
                </div>
            )}
        </div>
    );
}
