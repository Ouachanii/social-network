"use client";
import { useState } from 'react';
import styles from '../styles/create-post.module.css';

export function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [privacy, setPrivacy] = useState('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('content', content);
      formData.append('privacy', privacy);
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch('http://localhost:8080/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post');
      }

      // Clear form
      setContent('');
      setImage(null);
      setPrivacy('public');
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.createPost}>
      <form onSubmit={handleSubmit}>
        <div className={styles.userInput}>
          <div className={styles.avatar}></div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            required
            className={styles.textarea}
          />
        </div>

        {image && (
          <div className={styles.imagePreview}>
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className={styles.previewImage}
            />
            <button
              type="button"
              className={styles.removeImage}
              onClick={() => setImage(null)}
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.postOptions}>
          <div className={styles.addToPost}>
            <span className={styles.addToPostText}>Add to your post</span>
            <div className={styles.postButtons}>
              <label className={styles.mediaButton}>
                <span role="img" aria-label="Add Photo">🖼️</span>
                Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  hidden
                />
              </label>
              <div className={styles.privacySelector}>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className={styles.select}
                >
                  <option value="public">🌎 Public</option>
                  <option value="almost_private">👥 Almost Private</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className={styles.postButton}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
