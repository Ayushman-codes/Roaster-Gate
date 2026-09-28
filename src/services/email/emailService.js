// Frontend Email Service - Client-side API calls
const API_BASE = '/api/email';

/**
 * Request a password reset email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Response with success status and message
 */
export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE}/password-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send reset email');
  }

  return data;
}

/**
 * Send email verification
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @returns {Promise<Object>} Response with success status and message
 */
export async function requestEmailVerification(email, name) {
  const response = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send verification email');
  }

  return data;
}

/**
 * Send welcome email
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @returns {Promise<Object>} Response with success status and message
 */
export async function sendWelcomeEmail(email, name) {
  const response = await fetch(`${API_BASE}/welcome`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send welcome email');
  }

  return data;
}

/**
 * Validate a password reset token
 * @param {string} token - Reset token from URL
 * @returns {Promise<Object>} Response with valid status and user info
 */
export async function validateResetToken(token) {
  const response = await fetch(`${API_BASE}/validate-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Invalid or expired token');
  }

  return data;
}

/**
 * Complete password reset with token and new password
 * @param {string} token - Reset token from URL
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Response with success status
 */
export async function completePasswordReset(token, newPassword) {
  const response = await fetch(`${API_BASE}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to reset password');
  }

  return data;
}