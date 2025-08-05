"use client";
import { useState, useEffect } from 'react';
import styles from '../styles/posts.module.css';
import { formatDate } from './PostFeed';

export function CommentSection({ postId, onCommentAdded }) {
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');

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
        if (!commentInput.trim() && !selectedImage) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const formData = new FormData();
            formData.append('content', commentInput);
            
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create comment');
            }

            const data = await response.json();
            
            // Add new comment to the list
            setComments(prev => [data.comment, ...prev]);
            
            // Clear input and image
            setCommentInput('');
            setSelectedImage(null);
            setImagePreview(null);
            
            // Notify parent component
            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
                return;
            }
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }
            
            setSelectedImage(file);
            if (error) setError('');
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };


    useEffect(() => {
        fetchComments();
    }, [postId]);

    return (
        <div className={styles.commentsSection}>
            {/* Comment Input */}
            <div className={styles.commentInput}>
                <div className={styles.commentInputRow}>
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInput}
                        onChange={(e) => {
                            setCommentInput(e.target.value);
                            if (error) setError('');
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !isLoading) {
                                handleCommentSubmit();
                            }
                        }}
                        className={styles.commentInputField}
                        disabled={isLoading}
                    />
                    <div className={styles.commentActions}>
                        <label htmlFor={`image-upload-${postId}`} className={styles.imageUploadButton}>
                            📷
                            <input
                                id={`image-upload-${postId}`}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <button
                            onClick={handleCommentSubmit}
                            className={styles.commentSubmitButton}
                            disabled={(!commentInput.trim() && !selectedImage) || isLoading}
                        >
                            {isLoading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                    <div className={styles.imagePreview}>
                        <img src={imagePreview} alt="Preview" className={styles.previewImage} />
                        <button onClick={removeImage} className={styles.removeImageButton}>
                            ✕
                        </button>
                    </div>
                )}
                
                {/* Error Display */}
                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                        <button 
                            onClick={() => setError('')} 
                            className={styles.errorCloseButton}
                        >
                            ✕
                        </button>
                    </div>
                )}
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