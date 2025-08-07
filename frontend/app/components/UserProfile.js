import "../styles/UserProfile.css";

const UserProfile = () => {
  return (
    <div className="user-profile">
      <div className="user-profile-content">
        {/* Profile Header */}
        <div className="user-profile-header">
          <div className="user-profile-avatar">
            <span role="img" aria-label="avatar" className="user-profile-avatar-icon">👤</span>
          </div>
          <h3 className="user-profile-name">Alex Thompson</h3>
          <p className="user-profile-username">@alexthompson</p>
        </div>

        {/* Profile Stats */}
        <div className="user-profile-stats">
          <div>
            <p className="user-profile-stat-number">127</p>
            <p className="user-profile-stat-label">Posts</p>
          </div>
          <div>
            <p className="user-profile-stat-number">1.2k</p>
            <p className="user-profile-stat-label">Friends</p>
          </div>
          <div>
            <p className="user-profile-stat-number">893</p>
            <p className="user-profile-stat-label">Following</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="user-profile-info">
          <div className="user-profile-info-item">
            <span className="user-profile-info-icon" role="img" aria-label="location">📍</span>
            <span className="user-profile-info-text">San Francisco, CA</span>
          </div>
          <div className="user-profile-info-item">
            <span className="user-profile-info-icon" role="img" aria-label="calendar">📅</span>
            <span className="user-profile-info-text">Joined March 2022</span>
          </div>
        </div>

        {/* Action Button */}
        <button className="user-profile-button">
          <span className="user-profile-button-icon" role="img" aria-label="edit">✏️</span>
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
