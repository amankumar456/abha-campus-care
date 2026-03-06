export interface PrescriptionWithDetails {
  id: string;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  student_id: string;
  doctor_id: string | null;
  appointment_id: string;
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
  doctor?: { name: string; designation: string };
  items?: { id: string; medicine_name: string; dosage: string; frequency: string; duration: string; instructions: string | null; meal_timing: string | null }[];
  dispensing_status?: string;
  dispensing_id?: string;
}

export interface InventoryItem {
  id: string;
  medicine_name: string;
  generic_name: string | null;
  category: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  expiry_date: string | null;
  batch_number: string | null;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
