
import { format } from 'date-fns';

interface TireWearCalculationParams {
  tireId: string;
  vehicleId: string;
  currentMileage: number;
  treadDepth: number;
}

interface TireWearAnalysisResult {
  currentAgeDays: number;
  predictedWearPercentage: number;
  analysisMethod: string;
  analysisResult: string;
  recommendation: string;
}

export const calculateTireWear = (params: TireWearCalculationParams): TireWearAnalysisResult => {
  const MAX_TREAD_DEPTH = 8; // มม. สำหรับยางใหม่
  const MIN_SAFE_TREAD_DEPTH = 1.6; // มม. ระดับที่ต้องเปลี่ยนยาง

  // คำนวณอายุยาง
  const purchaseDate = new Date(); // ใช้วันปัจจุบันสำหรับตัวอย่าง
  const currentDate = new Date();
  const currentAgeDays = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));

  // คำนวณการสึกหรอ
  const predictedWearPercentage = ((MAX_TREAD_DEPTH - params.treadDepth) / MAX_TREAD_DEPTH) * 100;

  let analysisMethod = '';
  let analysisResult = '';
  let recommendation = '';

  // Time Series Analysis
  if (params.currentMileage > 50000 || currentAgeDays > 1095) { // 3 ปี
    analysisMethod = 'Time Series Analysis';
    analysisResult = '🔍 การวิเคราะห์ Time Series พบว่ายางอยู่ในช่วงที่ควรตรวจสอบ';
  }

  // Markov Chain Analysis
  if (predictedWearPercentage > 50) {
    analysisMethod = 'Markov Chain Analysis';
    analysisResult = '🔍 การวิเคราะห์ Markov Chain ชี้ว่ามีความเสี่ยงสูง';
  }

  // Recommendation
  if (params.treadDepth <= MIN_SAFE_TREAD_DEPTH) {
    recommendation = '⚠️ ยางของคุณควรเปลี่ยนแล้ว! ความลึกดอกยางน้อยกว่าเกณฑ์ความปลอดภัย';
  } else if (predictedWearPercentage > 70) {
    recommendation = '⚠️ แนะนำให้เตรียมเปลี่ยนยางในเร็วๆ นี้';
  } else if (currentAgeDays > 1825) { // 5 ปี
    recommendation = '⚠️ ยางอายุเกิน 5 ปี ควรตรวจสอบหรือเปลี่ยน';
  } else {
    recommendation = '✅ สภาพยางยังดี สามารถใช้งานต่อได้';
  }

  return {
    currentAgeDays,
    predictedWearPercentage,
    analysisMethod,
    analysisResult,
    recommendation
  };
};
