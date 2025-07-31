export type UserRole = 'admin' | 'member' | 'guest' | 'manager';

export type User = {
  id: string;
  email: string | null;
  full_name?: string | null;
  role: UserRole;
  // Add other user-related fields as needed
};

export type AuthSession = {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: UserRole;
    created_at: string;
    updated_at: string | null;
  };
  token: string;
};

export type LoftStatus = 'available' | 'occupied' | 'maintenance';

export type InternetConnectionType = {
  id: string;
  type: string;
  speed: string | null;
  provider: string | null;
  status: string | null;
  cost: number | null;
  created_at: string;
};

export type LoftOwner = {
  id: string;
  name: string;
  ownership_type: 'company' | 'third_party';
};

export type ZoneArea = {
  id: string;
  name: string;
};

export type Loft = {
  id: string;
  name: string;
  address: string;
  description?: string;
  price_per_month: number;
  status: LoftStatus;
  owner_id: string;
  company_percentage: number;
  owner_percentage: number;
  zone_area_id?: string;
  internet_connection_type_id?: string;
  water_customer_code?: string;
  water_contract_code?: string;
  water_meter_number?: string;
  water_correspondent?: string;
  electricity_pdl_ref?: string;
  electricity_customer_number?: string;
  electricity_meter_number?: string;
  electricity_correspondent?: string;
  gas_pdl_ref?: string;
  gas_customer_number?: string;
  gas_meter_number?: string;
  gas_correspondent?: string;
  phone_number?: string;
  frequence_paiement_eau?: string;
  prochaine_echeance_eau?: string;
  frequence_paiement_energie?: string;
  prochaine_echeance_energie?: string;
  frequence_paiement_telephone?: string;
  prochaine_echeance_telephone?: string;
  frequence_paiement_internet?: string;
  prochaine_echeance_internet?: string;
  frequence_paiement_tv?: string;
  prochaine_echeance_tv?: string;
};

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  user_id: string;
  created_at: string;
  due_date?: string | null;
  assigned_to?: string | null;
};

export type Notification = {
  id: string;
  message: string;
  title: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
  link?: string | null;
  sender_id?: string | null;
};

export type Setting = {
  key: string;
  value: any; // Using any for now, as JSONB can store various types
};

export type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
};

// Password validation schema
export const passwordSchema = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

export type Currency = {
  id: string;
  name: string;
  symbol: string;
  ratio: number;
  is_default: boolean;
};

export type Transaction = {
  id: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  date: string;
  category?: string;
  loft_id?: string;
  currency_id?: string;
  payment_method_id?: string;
};

export type Database = any;
