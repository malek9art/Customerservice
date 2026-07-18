export enum TravelOSStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
}

export interface IBaseEntity {
  id: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ICustomer extends IBaseEntity {
  fullName: string;
  phone: string;
  email?: string;
  nationality?: string;
}

export interface IDocument extends IBaseEntity {
  customerId?: string;
  type: string;
  status: string;
  fileUrl: string;
  expiryDate?: Date;
  extractedData?: any;
}

export interface IBooking extends IBaseEntity {
  customerId: string;
  type: string;
  status: string;
  totalAmount: number;
}
