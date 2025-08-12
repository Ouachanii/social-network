"use client";
import { useState, useEffect } from 'react';
import styles from '../styles/create-post.module.css';
import { useUser } from '../context/UserContext';
import { getAvatarUrl, hasAvatar } from '../utils/avatarUtils';

export function CreatePost({ onPostCreated, groupId, user: propUser }) {
  const { user: contextUser } = useUser();
  const user = propUser || contextUser;
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
      if (groupId) {
        formData.append('group_id', groupId);
      }
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch('/api/posts', {
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

      // clear the form
      setContent('');
      setImage(null);
      setPrivacy('public');
      
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
          <div className={styles.Authoravatar}>
            {user && hasAvatar(user.avatar) ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt={'User Avatar'}
                className={styles.authorAvatar}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.style.display = 'none';
                  // Show default avatar when image fails to load
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={styles.defaultAvatar} style={{ display: user && hasAvatar(user.avatar) ? 'none' : 'flex' }}>
              <i className="fa-solid fa-user" style={{color: '#9b4ef3ff'}}></i>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
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
                <span role="img" aria-label="Add Photo">
                  <i className="fa-solid fa-image" style={{color: '#9b4ef3ff'}}></i>
                </span>
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
            disabled={isLoading}
            className={styles.postButton}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
