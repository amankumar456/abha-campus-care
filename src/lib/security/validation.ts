import { z } from "zod";

// =============================================================
// COMPREHENSIVE SECURITY VALIDATION UTILITIES
// Provides strong input validation for the health portal
// =============================================================

// Password strength requirements (OWASP compliant)
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (!@#$%^&*)");

// Simple password schema for login (don't reveal requirements on login)
export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .max(128, "Password is too long");

// Email validation with common patterns
export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters")
  .transform(email => email.toLowerCase());

// Institutional email (NIT Warangal)
export const institutionalEmailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .regex(/@(nitw\.ac\.in|student\.nitw\.ac\.in)$/i, "Must be an official NIT Warangal email")
  .max(255, "Email must be less than 255 characters")
  .transform(email => email.toLowerCase());

// Name validation - prevents XSS and injection
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters, spaces, dots, hyphens, and apostrophes");

// Indian mobile number
export const indianMobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

// Roll number validation
export const rollNumberSchema = z
  .string()
  .trim()
  .min(5, "Roll number must be at least 5 characters")
  .max(20, "Roll number must be less than 20 characters")
  .regex(/^[A-Za-z0-9]+$/, "Roll number must contain only letters and numbers");

// Sanitize text input (removes potential XSS vectors)
export const sanitizeText = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Sanitize and validate free text (for notes, descriptions, etc.)
export const freeTextSchema = z
  .string()
  .trim()
  .max(2000, "Text must be less than 2000 characters")
  .transform(sanitizeText);

// Short text input (for single-line fields)
export const shortTextSchema = z
  .string()
  .trim()
  .max(200, "Text must be less than 200 characters")
  .transform(sanitizeText);

// UUID validation
export const uuidSchema = z
  .string()
  .uuid("Invalid ID format");

// Date validation (not in the future for birth dates, etc.)
export const pastDateSchema = z
  .string()
  .refine(date => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed <= new Date();
  }, "Date cannot be in the future");

// Future date validation (for appointments)
export const futureDateSchema = z
  .string()
  .refine(date => {
    const parsed = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(parsed.getTime()) && parsed >= today;
  }, "Date must be today or in the future");

// Rate limiting helper - check if action is allowed
export const isRateLimited = (
  attempts: number,
  maxAttempts: number,
  windowMs: number,
  firstAttemptTime: number
): boolean => {
  const now = Date.now();
  const windowExpired = now - firstAttemptTime > windowMs;
  
  if (windowExpired) {
    return false; // Window expired, allow action
  }
  
  return attempts >= maxAttempts; // True if rate limited
};

// Password strength calculator
export const calculatePasswordStrength = (password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];
  
  if (password.length >= 8) score += 1;
  else feedback.push("Use at least 8 characters");
  
  if (password.length >= 12) score += 1;
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Add uppercase letters");
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Add lowercase letters");
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("Add numbers");
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push("Add special characters (!@#$%^&*)");
  
  if (password.length >= 16) score += 1;
  
  // Check for common patterns that weaken passwords
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push("Avoid repeated characters");
  }
  
  if (/^(password|123456|qwerty|admin)/i.test(password)) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common passwords");
  }
  
  const labels: Array<'weak' | 'fair' | 'good' | 'strong' | 'very-strong'> = [
    'weak', 'weak', 'fair', 'good', 'strong', 'strong', 'very-strong', 'very-strong'
  ];
  
  return {
    score: Math.max(0, Math.min(score, 7)),
    label: labels[Math.max(0, Math.min(score, 7))],
    feedback
  };
};

// Content Security Policy nonce generator
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

// Secure comparison (constant time to prevent timing attacks)
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};
