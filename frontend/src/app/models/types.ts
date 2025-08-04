export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
  role?: 'ADMIN' | 'USER';
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string;
  address?: string;
}

// Helper function to get full name from User object
export function getUserName(user: User): string {
  if (user.name) return user.name;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
}

export interface Parcel {
  id: string;
  trackingNumber: string;
  description: string;
  weight: number;
  status:
    | 'PENDING'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'RECEIVED'
    | 'CANCELLED';
  sender: User;
  receiver: User;
  courier?: User;
  pickupLocation: string;
  destinationLocation: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  currency?: string;
  deliveryType?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  reviewed?: boolean;
  estimatedDistance?: string;
  estimatedDeliveryTime?: string;
  currentLocation?: string;
  routePolyline?: [number, number][]; 
  parcelRequestId?: string;
}

export interface PaginatedData<T> {
  parcels: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  access_token?: string;
}

export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  timestamp?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface MapLocation {
  latitude: number;
  longitude: number;
  address: string;
  label?: string;
  type?: 'origin' | 'current' | 'destination';
}

// Helper function to create MapLocation with safe address handling
export function createMapLocation(
  latitude: number,
  longitude: number,
  address: string | undefined,
  label?: string,
  type?: 'origin' | 'current' | 'destination'
): MapLocation {
  return {
    latitude,
    longitude,
    address: address || 'Unknown location',
    label,
    type,
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  address?: string;
}
