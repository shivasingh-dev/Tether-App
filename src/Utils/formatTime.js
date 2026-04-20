export default function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const messageTime = new Date(timestamp).getTime();
  const diff = now - messageTime;

  if (diff < 60000) return 'Just now';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const hours = Math.floor(diff / 3600000);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  const days = Math.floor(diff / 86400000);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

  