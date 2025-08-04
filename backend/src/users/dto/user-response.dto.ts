export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  role: string;
  profileImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
