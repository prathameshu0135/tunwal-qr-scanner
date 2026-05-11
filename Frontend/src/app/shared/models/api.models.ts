export interface AdminLoginResponse {
  message: string;
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface QrItem {
  _id: string;
  qrId: string;
  qrImageDataUrl: string;
  activationLink: string;
  emergencyLink: string;

  status: string;
  previousStatus?: string;
  blockedReason?: string;

  warrantyStatus?: string;
  emergencyStatus?: string;
  ownerMobile?: string;

  createdAt: string;
  updatedAt: string;

  customerName?: string;
  mobileNumber?: string;
  email?: string;
  bloodGroup?: string;
  disease?: string;
  address?: string;
  vehicleName?: string;
  chassisNumber?: string;
  motorNumber?: string;
  showroomName?: string;
}

export interface QrStatusData {
  qrId: string;
  status: string;
  warrantyStatus: string;
  emergencyStatus: string;
  redirectPath?: string;
}

export interface QrStatusResponse {
  success?: boolean;
  message?: string;

  data?: QrStatusData;

  // fallback support if backend sends direct object instead of { data: ... }
  qrId?: string;
  status?: string;
  warrantyStatus?: string;
  emergencyStatus?: string;
  redirectPath?: string;
}

export interface OtpSendResponse {
  success?: boolean;
  message: string;
  qrId: string;
  mobile: string;
  testOtp?: string;
}

export interface OtpVerifyResponse {
  success?: boolean;
  message: string;
  qrId: string;
  mobile: string;
  verified: boolean;
}

export interface WarrantyRegistrationResponse {
  success?: boolean;
  message: string;
  data: {
    qrId: string;
    warrantyStatus: string;
    emergencyStatus: string;
  };
}

export interface CustomerRegistrationResponse {
  success?: boolean;
  message: string;
  customer: any;
}

export interface EmergencyResponse {
  success?: boolean;
  qrId: string;
  owner: {
    customerName: string;
    mobileNumber: string;
    email: string;
    bloodGroup: string;
    disease: string;
    address: string;
    vehicleName: string;
    chassisNumber: string;
    motorNumber: string;
    showroomName: string;
  };
  emergencyContacts: Array<{
    name: string;
    mobile: string;
    email: string;
    relation: string;
  }>;
  actions: {
    police: string;
    ambulance: string;
  };
}

export interface DashboardResponse {
  totalQrs: number;
  activeQrs: number;
  inactiveQrs: number;
  blockedQrs: number;

  warrantyPending: number;
  warrantyRegistered: number;

  emergencyInactive: number;
  emergencyActive: number;
  emergencySkipped: number;

  totalCustomers: number;
  totalScans: number;
  totalAlerts: number;
  recentScans: any[];
}

export interface WarrantyRecord {
  _id: string;
  qrId: string;

  scooterName: string;
  scooterColor: string;
  controllerNumber: string;
  batteryNumber: string;
  motorNumber: string;
  chassisNumber: string;
  chargerNumber: string;

  dealerName: string;
  dealerAddress: string;
  state: string;
  dateOfSale: string;

  customerName: string;
  contactNumber: string;

  createdAt: string;
  updatedAt: string;
}

export interface WarrantyListResponse {
  success: boolean;
  count: number;
  data: WarrantyRecord[];
}

export interface WarrantyDetailResponse {
  success: boolean;
  data: WarrantyRecord;
}