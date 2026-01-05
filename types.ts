
export enum VehicleType {
  TWO_WHEELER = '2W',
  FOUR_WHEELER = '4W'
}

export enum ParkingStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  RESERVED = 'Reserved',
  FULL = 'Full'
}

export enum UserRole {
  USER = 'user',
  STAFF = 'staff'
}

export interface Vehicle {
  regNo: string;
  type: VehicleType;
}

export interface ParkingHistory {
  id: string;
  userId: string;
  slotId: string;
  location: string;
  entryTime: string;
  exitTime?: string;
  charges: number;
  status: 'active' | 'completed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  vehicle: Vehicle;
  role: UserRole;
  history: ParkingHistory[];
}

export interface ParkingSlot {
  id: string;
  location: string;
  status: ParkingStatus;
  currentUserId?: string;
  entryTime?: string;
  capacity: number;
  type: VehicleType;
}
