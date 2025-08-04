export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const RESPONSE_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logout successful',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_ALREADY_EXISTS: 'User already exists',
  TOKEN_INVALID: 'Invalid token',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',

  // Users
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_NOT_FOUND: 'User not found',
  USER_FETCHED: 'User fetched successfully',
  USERS_FETCHED: 'Users fetched successfully',

  // Parcels
  PARCEL_CREATED: 'Parcel created successfully',
  PARCEL_UPDATED: 'Parcel updated successfully',
  PARCEL_DELETED: 'Parcel deleted successfully',
  PARCEL_NOT_FOUND: 'Parcel not found',
  PARCEL_FETCHED: 'Parcel fetched successfully',
  PARCELS_FETCHED: 'Parcels fetched successfully',
  PARCEL_STATUS_UPDATED: 'Parcel status updated successfully',

  // General
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
} as const;

export const PARCEL_STATUS = {
  PENDING: 'PENDING',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export const EMAIL_TYPES = {
  WELCOME: 'welcome',
  PARCEL_STATUS_UPDATE: 'parcel_status_update',
  PARCEL_DELIVERED: 'parcel_delivered',
  PASSWORD_RESET: 'password_reset',
  CONTACT_MESSAGE_REPLY: 'contact_message_reply',
  NEW_PARCEL_REQUEST: 'new_parcel_request',
  PARCEL_REQUEST_STATUS_UPDATE: 'parcel_request_status_update',
  NEW_USER_CREDENTIALS: 'new_user_credentials',
} as const;

export const WEIGHT_CATEGORIES = {
  LIGHT: { min: 0, max: 5, pricePerKg: 5 }, // 0-5kg
  MEDIUM: { min: 5.01, max: 20, pricePerKg: 8 }, // 5.01-20kg
  HEAVY: { min: 20.01, max: 50, pricePerKg: 12 }, // 20.01-50kg
  EXTRA_HEAVY: { min: 50.01, max: Infinity, pricePerKg: 20 }, // 50kg+
} as const;

// Export error codes
export * from './error-codes';
