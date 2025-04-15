
interface TireWearCalculationParams {
  tireId: string;
  vehicleId: string;
  currentMileage: number;
  treadDepth: number;
}

interface TireWearAnalysisResult {
  currentAgeDays: number;
  predictedWearPercentage: number;
  predictedLifespan: number;
  analysisMethod: string;
  analysisResult: string;
  recommendation: string;
  wearFormula: string;
  statusCode: 'normal' | 'warning' | 'critical' | 'error';
}

export const calculateTireWear = (params: TireWearCalculationParams): TireWearAnalysisResult => {
  const MAX_TREAD_DEPTH = 8; // มม. สำหรับยางใหม่
  const MIN_SAFE_TREAD_DEPTH = 1.6; // มม. ระดับที่ต้องเปลี่ยนยาง
  const AVG_LIFESPAN_KM = 50000; // ระยะทางโดยประมาณที่ยางใช้งานได้ (กม.)

  // คำนวณอายุยาง (วัน)
  const purchaseDate = new Date(); // ในกรณีจริงจะใช้ข้อมูลจากฐานข้อมูล
  purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 365)); // สมมติว่าซื้อมาไม่เกิน 1 ปี
  const currentDate = new Date();
  const currentAgeDays = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));

  // คำนวณการสึกหรอตามสูตรจาก Google Colab
  const wearRate = (MAX_TREAD_DEPTH - params.treadDepth) / MAX_TREAD_DEPTH;
  const predictedWearPercentage = Math.min(wearRate * 100, 100);

  // คำนวณอายุการใช้งานที่เหลือโดยประมาณ (กม.)
  const remainingDepth = params.treadDepth - MIN_SAFE_TREAD_DEPTH;
  const remainingPercentage = remainingDepth / (MAX_TREAD_DEPTH - MIN_SAFE_TREAD_DEPTH);
  const predictedLifespan = Math.max(Math.round(remainingPercentage * AVG_LIFESPAN_KM), 0);

  let analysisMethod = 'การวิเคราะห์แบบผสมผสาน';
  let analysisResult = '';
  let recommendation = '';
  let statusCode: 'normal' | 'warning' | 'critical' | 'error' = 'normal';
  const wearFormula = `${MAX_TREAD_DEPTH - params.treadDepth} ÷ ${MAX_TREAD_DEPTH} × 100 = ${predictedWearPercentage.toFixed(2)}%`;

  // ตรวจสอบผลการสึกหรอและให้คำแนะนำ
  if (params.treadDepth <= MIN_SAFE_TREAD_DEPTH) {
    statusCode = 'critical';
    analysisResult = 'ความลึกดอกยางต่ำกว่าระดับปลอดภัย';
    recommendation = 'ควรเปลี่ยนยางทันที เพื่อความปลอดภัยในการขับขี่';
  } else if (predictedWearPercentage >= 75) {
    statusCode = 'warning';
    analysisResult = 'ยางมีการสึกหรอสูง';
    recommendation = 'ควรวางแผนเปลี่ยนยางในอีก 1-2 เดือนข้างหน้า';
  } else if (predictedWearPercentage >= 50) {
    statusCode = 'normal';
    analysisResult = 'ยางมีการสึกหรอปานกลาง';
    recommendation = 'ควรตรวจสอบสภาพยางทุก 2-3 เดือน';
  } else {
    statusCode = 'normal';
    analysisResult = 'ยางมีสภาพดี';
    recommendation = 'ยางมีสภาพดี สามารถใช้งานต่อได้ปกติ';
  }

  return {
    currentAgeDays,
    predictedWearPercentage: parseFloat(predictedWearPercentage.toFixed(2)),
    predictedLifespan,
    analysisMethod,
    analysisResult,
    recommendation,
    wearFormula,
    statusCode
  };
};
