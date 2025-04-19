
// โมเดลสำหรับข้อมูลยาง
export interface Tire {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  size: string;
  type: 'new' | 'retreaded'; // ยางใหม่หรือยางหล่อดอก
  position?: string; // ตำแหน่งที่ติดตั้งบนรถ
  vehicleId?: string; // รถที่ติดตั้งยางนี้
  purchaseDate: string;
  purchasePrice: number;
  supplier: string;
  status: 'active' | 'maintenance' | 'retreading' | 'expired' | 'sold';
  treadDepth: number; // ความลึกดอกยางล่าสุด (มิลลิเมตร)
  mileage: number; // ระยะทางที่ใช้งานล่าสุด
  notes?: string;
}

// โมเดลสำหรับข้อมูลรถ
export interface Vehicle {
  id: string;
  registrationNumber: string; // ทะเบียนรถ
  type: string; // ประเภทรถ (รถบรรทุก 6 ล้อ, รถพ่วง, ฯลฯ)
  brand: string; // ยี่ห้อรถ
  model: string; // รุ่นรถ
  wheelPositions: number; // จำนวนตำแหน่งล้อ
  currentMileage: number; // ระยะทางปัจจุบัน
  tirePositions: TirePosition[]; // ตำแหน่งล้อทั้งหมดของรถ
  notes?: string;
}

// โมเดลสำหรับข้อมูลตำแหน่งยางบนรถ
export interface TirePosition {
  position: string; // เช่น "หน้าซ้าย", "หลังขวาใน" ฯลฯ
  tireId?: string; // รหัสยางที่ติดตั้งในตำแหน่งนี้
}

// โมเดลสำหรับข้อมูลผู้จำหน่าย
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
}

// โมเดลสำหรับบันทึกกิจกรรม
export interface ActivityLog {
  id: string;
  date: string;
  activityType: string;
  tireId?: string;
  vehicleId?: string;
  position?: string;
  mileage?: number;
  cost?: number;
  description?: string;
  performedBy?: string;
  measurementValue?: number;
  newTireId?: string;
  salePrice?: number;
  buyer?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Additional properties specific to activity types
  newPosition?: string; // For tire rotation activities
}

// โมเดลสำหรับผลลัพธ์การวิเคราะห์การสึกหรอของยาง
export interface TireWearAnalysisResult {
  tireId: string;
  currentDepth: number;
  position?: string;
  currentAgeDays: number;
  wearRatePerDay: number;
  wearRatePer1000Km: number;
  remainingDepthToLegal: number;
  remainingDepthToSafety: number;
  daysToLegal: number;
  daysToSafety: number;
  predictedDateLegal: Date;
  predictedDateSafety: Date;
  statusCode: 'normal' | 'warning' | 'critical' | 'error';
  status: string;
  analysisMethod: string;
  analysisResult: string;
  recommendation: string;
  wearFormula: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

// โมเดลสำหรับการคำนวณความเสียหายของยาง
export interface TireWearCalculation {
  id: string;
  calculation_date: string;
  current_mileage: number;
  current_age_days: number;
  tread_depth_mm: number;
  predicted_wear_percentage: number;
  predicted_lifespan?: number;
  wear_formula?: string;
  status_code?: 'normal' | 'warning' | 'critical' | 'error';
  tire_id: string;
  vehicle_id: string;
  analysis_method: string;
  analysis_result: string;
  recommendation: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  analysis_type: 'predict_wear' | 'cluster_analysis' | 'time_series_prediction' | 'standard_prediction' | 'statistical_regression' | 'position_based';
}
