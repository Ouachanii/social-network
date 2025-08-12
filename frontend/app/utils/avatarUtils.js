// Utility function to get the correct avatar URL
export function getAvatarUrl(avatarPath) {
  if (!avatarPath || avatarPath === '' || avatarPath === 'null') {
    return null;
  }
  
  // If the path contains 'uploads/avatars/', extract just the filename
  if (avatarPath.includes('uploads/avatars/')) {
    const filename = avatarPath.split('uploads/avatars/').pop();
    return `http://localhost:8080/uploads/avatars/${filename}`;
  }
  
  // If it's just a filename, use it directly
  return `http://localhost:8080/uploads/avatars/${avatarPath}`;
}



// Utility function to check if avatar exists
export function hasAvatar(avatarPath) {
  return avatarPath && avatarPath !== '' && avatarPath !== 'null';
}
