
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
  activityType: 
    | 'repair' // ซ่อมยาง
    | 'change' // เปลี่ยนยาง
    | 'rotation' // หมุนยาง 
    | 'measure' // วัดความลึกดอกยาง
    | 'retreading' // ส่งหล่อดอกยาง
    | 'sale'; // ขายยาง
  tireId: string;
  vehicleId: string;
  mileage: number;
  cost: number;
  description: string;
  performedBy: string;
  newTireId?: string; // กรณีเปลี่ยนยาง
  newPosition?: string; // กรณีหมุนยาง
  measurementValue?: number; // กรณีวัดความลึกดอกยาง
  salePrice?: number; // กรณีขายยาง
  buyer?: string; // กรณีขายยาง
  notes?: string;
}
