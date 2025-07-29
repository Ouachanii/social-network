"use client";
import { useState, useEffect } from 'react';
import styles from '../styles/posts.module.css';

export function CommentSection({ postId, onCommentAdded }) {
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }

            const data = await response.json();
            setComments(data.comments || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentInput.trim()) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const formData = new FormData();
            formData.append('content', commentInput);

            const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to create comment');
            }

            const data = await response.json();
            
            // Add new comment to the list
            setComments(prev => [data.comment, ...prev]);
            
            // Clear input
            setCommentInput('');
            
            // Notify parent component
            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (error) {
            console.error('Error creating comment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const fixedDateStr = dateString.replace(' at ', ' ');
        const date = new Date(fixedDateStr);

        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        const now = Date.now();
        const diff = now - date.getTime();

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) return `${seconds}s`;
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        if (weeks < 4) return `${weeks}w`;
        if (months < 12) return `${months}mo`;
        return `${years}y`;
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    return (
        <div className={styles.commentsSection}>
            {/* Comment Input */}
            <div className={styles.commentInput}>
                <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                            handleCommentSubmit();
                        }
                    }}
                    className={styles.commentInputField}
                    disabled={isLoading}
                />
                <button
                    onClick={handleCommentSubmit}
                    className={styles.commentSubmitButton}
                    disabled={!commentInput.trim() || isLoading}
                >
                    {isLoading ? 'Posting...' : 'Post'}
                </button>
            </div>

            {/* Comments List */}
            <div className={styles.commentsList}>
                {comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.Id} className={styles.comment}>
                            <div className={styles.commentHeader}>
                                <img
                                    src={comment.Avatar ? `http://localhost:8080/${comment.Avatar}` : '/default-avatar.jpg'}
                                    alt={comment.Username}
                                    className={styles.commentAvatar}
                                    onError={(e) => {
                                        console.log('Comment avatar failed to load:', comment.Avatar);
                                    }}
                                />
                                <div className={styles.commentInfo}>
                                    <span className={styles.commentAuthor}>{comment.Username}</span>
                                    <span className={styles.commentTime}>{formatDate(comment.CreatedAt)}</span>
                                </div>
                            </div>
                            <div className={styles.commentContent}>
                                <p>{comment.Content}</p>
                                {comment.Image && (
                                    <img
                                        src={`http://localhost:8080/${comment.Image}`}
                                        alt="Comment attachment"
                                        className={styles.commentImage}
                                        onError={(e) => {
                                            console.log('Comment image failed to load:', comment.Image);
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
                )}
            </div>
        </div>
    );
} 