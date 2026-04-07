// Validation utility functions

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return minLength && hasUppercase && hasLowercase && hasNumber;
};

export const getPasswordStrength = (
  password: string
): {
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} => {
  if (password.length < 8) {
    return {
      strength: 'weak',
      message: 'Password must be at least 8 characters',
    };
  }

  let score = 0;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  if (score <= 2) return { strength: 'weak', message: 'Weak password' };
  if (score <= 3) return { strength: 'medium', message: 'Medium password' };
  return { strength: 'strong', message: 'Strong password' };
};

export const isValidImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
};

export const getImageValidationError = (file: File): string | null => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are allowed';
  }

  if (file.size > maxSize) {
    return 'Image size must be less than 5MB';
  }

  return null;
};
