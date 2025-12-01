/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username (3-20 chars, alphanumeric and underscore)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('비밀번호는 8자 이상이어야 합니다');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate weight (kg)
 */
export function isValidWeight(weight: number): boolean {
  return weight >= 20 && weight <= 300;
}

/**
 * Validate height (cm)
 */
export function isValidHeight(height: number): boolean {
  return height >= 100 && height <= 250;
}

/**
 * Validate age
 */
export function isValidAge(age: number): boolean {
  return age >= 13 && age <= 120;
}

/**
 * Validate calorie goal
 */
export function isValidCalorieGoal(calories: number): boolean {
  return calories >= 500 && calories <= 10000;
}

/**
 * Validate water intake (ml)
 */
export function isValidWaterIntake(ml: number): boolean {
  return ml >= 0 && ml <= 10000;
}

/**
 * Validate rating (1-5)
 */
export function isValidRating(rating: number): boolean {
  return rating >= 1 && rating <= 5;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
