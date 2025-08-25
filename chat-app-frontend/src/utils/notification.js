// Notification sound
const notificationSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3');

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Show notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission !== 'granted') return;

  // Play sound
  notificationSound.play().catch(e => console.log('Notification sound error:', e));

  // Show browser notification
  const notification = new Notification(title, {
    icon: options.icon || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    body: options.body || 'New message received',
    silent: false
  });

  // Close notification after 5 seconds
  setTimeout(() => notification.close(), 5000);

  // Focus window when notification is clicked
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};