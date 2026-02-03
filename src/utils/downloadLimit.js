const STORAGE_KEY_PREFIX = 'guest_download_count_';
const MAX_DOWNLOADS = 5;

/**
 * Checks if the guest is allowed to download.
 * Increments the counter if allowed.
 * @returns {boolean} True if allowed, false if limit reached.
 */
export const checkGuestDownloadLimit = () => {
  const today = new Date().toISOString().split('T')[0];
  const key = `${STORAGE_KEY_PREFIX}${today}`;
  
  const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
  
  if (currentCount >= MAX_DOWNLOADS) {
    return false;
  }
  
  localStorage.setItem(key, (currentCount + 1).toString());
  return true;
};

/**
 * Gets the remaining downloads for today.
 * @returns {number} Remaining downloads.
 */
export const getGuestRemainingDownloads = () => {
  const today = new Date().toISOString().split('T')[0];
  const key = `${STORAGE_KEY_PREFIX}${today}`;
  const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
  return Math.max(0, MAX_DOWNLOADS - currentCount);
};
