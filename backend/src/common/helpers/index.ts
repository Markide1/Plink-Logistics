/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import axios from 'axios';
import * as bcrypt from 'bcryptjs';
import { WEIGHT_CATEGORIES } from '../constants';

export async function getGoogleMapsRoute(
  origin: string,
  destination: string,
): Promise<{ distance: number; duration: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Google Maps API key not set');
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
  try {
    const res = await axios.get(url);
    const route = res.data.routes?.[0]?.legs?.[0];
    if (!route) return null;
    return {
      distance: route.distance.value / 1000, // meters to km
      duration: Math.ceil(route.duration.value / 3600), // seconds to hours
    };
  } catch {
    return null;
  }
}

export class CommonHelpers {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate tracking number
   */
  static generateTrackingNumber(): string {
    const prefix = 'PCL-';
    const timestampPart = Date.now().toString().slice(-1);
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    const randomChar = Math.random().toString(36).substring(2, 3).toUpperCase();
    return `${prefix}${timestampPart}${randomPart}${randomChar}`;
  }

  /**
   * Calculate parcel price based on weight
   */
  static calculateParcelPrice(weight: number): number {
    if (weight <= WEIGHT_CATEGORIES.LIGHT.max) {
      return weight * WEIGHT_CATEGORIES.LIGHT.pricePerKg;
    } else if (weight <= WEIGHT_CATEGORIES.MEDIUM.max) {
      return weight * WEIGHT_CATEGORIES.MEDIUM.pricePerKg;
    } else if (weight <= WEIGHT_CATEGORIES.HEAVY.max) {
      return weight * WEIGHT_CATEGORIES.HEAVY.pricePerKg;
    } else {
      return weight * WEIGHT_CATEGORIES.EXTRA_HEAVY.pricePerKg;
    }
  }

  /**
   * Get weight category for a given weight
   */
  static getWeightCategory(weight: number): string {
    if (weight <= WEIGHT_CATEGORIES.LIGHT.max) {
      return 'Light (0-5kg)';
    } else if (weight <= WEIGHT_CATEGORIES.MEDIUM.max) {
      return 'Medium (5-20kg)';
    } else if (weight <= WEIGHT_CATEGORIES.HEAVY.max) {
      return 'Heavy (20-50kg)';
    } else {
      return 'Extra Heavy (50kg+)';
    }
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format phone number
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
  }

  /**
   * Standardized API response
   */
  static createResponse<T>(
    success: boolean,
    message: string,
    data?: T,
    statusCode?: number,
  ) {
    return {
      success,
      message,
      data: data || null,
      statusCode: statusCode || (success ? 200 : 400),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate random string
   */
  static generateRandomString(length: number = 8): string {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }

  /**
   * Sleep function for delays
   */
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
