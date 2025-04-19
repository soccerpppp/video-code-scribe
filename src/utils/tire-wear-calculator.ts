// Constants for calculation
const LEGAL_LIMIT = 1.6; // มม. - เกณฑ์บังคับเปลี่ยนตามกฎหมาย 
const SAFETY_LIMIT = 3.0; // มม. - เกณฑ์แนะนำเพื่อความปลอดภัย
const DEFAULT_TREAD_DEPTH_NEW_TIRE = 15.0; // มม. สำหรับยางใหม่

interface TireWearCalculationParams {
  tireId: string;
  vehicleId: string;
  currentMileage: number;
  treadDepth: number;
  purchaseDate?: string; // วันที่ซื้อ/ติดตั้ง
  initialTreadDepth?: number; // ความลึกดอกยางเริ่มต้น
  position?: string; // ตำแหน่งติดตั้งยาง
  measurementHistory?: {date: string, depth: number, mileage?: number}[];
  avgDailyDistance?: number; // ระยะทางเฉลี่ยต่อวัน (กม.)
  analysisType?: 'standard_prediction' | 'statistical_regression' | 'position_based' | 'predict_wear' | 'cluster_analysis' | 'time_series_prediction';
}

interface TireWearAnalysisResult {
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
  predictedWearPercentage: number;
  predictedLifespan?: number;
}

export const calculateTireWear = (params: TireWearCalculationParams): TireWearAnalysisResult => {
  // Default to 'standard_prediction' if no analysis type is specified or if an incompatible type is provided
  const analysisType = params.analysisType || 'standard_prediction';
  
  // Map legacy analysis types to new types if needed
  const mappedAnalysisType = mapAnalysisType(analysisType);

  switch (mappedAnalysisType) {
    case 'standard_prediction':
      return calculateStandardPrediction(params);
    case 'statistical_regression':
      return calculateStatisticalRegression(params);
    case 'position_based':
      return calculatePositionBased(params);
    default:
      // Default to standard prediction for any unhandled type
      return calculateStandardPrediction(params);
  }
};

// Helper function to map legacy analysis types to new types
function mapAnalysisType(type: string): 'standard_prediction' | 'statistical_regression' | 'position_based' {
  switch(type) {
    case 'predict_wear':
      return 'standard_prediction';
    case 'cluster_analysis':
      return 'standard_prediction';
    case 'time_series_prediction':
      return 'statistical_regression';
    case 'standard_prediction':
      return 'standard_prediction';
    case 'statistical_regression':
      return 'statistical_regression';
    case 'position_based':
      return 'position_based';
    default:
      return 'standard_prediction';
  }
}

/**
 * คำนวณการสึกหรอแบบมาตรฐาน (ใช้ข้อมูลการวัดล่าสุดและการวัดก่อนหน้า)
 */
function calculateStandardPrediction(params: TireWearCalculationParams): TireWearAnalysisResult {
  // ใช้ความลึกดอกยางเริ่มต้นตามที่ระบุ หรือค่าเริ่มต้นถ้าไม่ได้ระบุ
  const initialDepth = params.initialTreadDepth || DEFAULT_TREAD_DEPTH_NEW_TIRE;
  const currentDepth = params.treadDepth;
  const currentDate = new Date();
  
  // คำนวณอายุยางเป็นวัน
  let currentAgeDays = 0;
  const purchaseDate = params.purchaseDate ? new Date(params.purchaseDate) : undefined;
  
  if (purchaseDate) {
    currentAgeDays = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
  } else {
    // ถ้าไม่มีวันที่ติดตั้ง ประมาณจากการสึกหรอ
    const wearRatio = (initialDepth - currentDepth) / initialDepth;
    currentAgeDays = Math.floor(wearRatio * 365); // ประมาณอายุ 1 ปี
  }
  
  // คำนวณอัตราการสึกหรอต่อวันเฉลี่ย
  let wearRatePerDay = 0;
  let wearRatePer1000Km = 0;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
  
  // 1. วิธีที่ดีที่สุด: ใช้ประวัติการวัดหลายครั้ง
  if (params.measurementHistory && params.measurementHistory.length >= 2) {
    const sortedHistory = [...params.measurementHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // คำนวณจากข้อมูลการวัดล่าสุด 2 ครั้ง
    const latest = sortedHistory[sortedHistory.length - 1];
    const previous = sortedHistory[sortedHistory.length - 2];
    
    const depthDiff = previous.depth - latest.depth;
    const daysDiff = (new Date(latest.date).getTime() - new Date(previous.date).getTime()) / (1000 * 3600 * 24);
    
    // หลีกเลี่ยงการหารด้วย 0
    wearRatePerDay = daysDiff > 0 ? depthDiff / daysDiff : 0;
    
    // คำนวณอัตราการสึกหรอต่อระยะทาง (ถ้ามีข้อมูลระยะทาง)
    if (latest.mileage !== undefined && previous.mileage !== undefined) {
      const mileageDiff = latest.mileage - previous.mileage;
      if (mileageDiff > 0) {
        wearRatePer1000Km = (depthDiff / mileageDiff) * 1000;
      }
    } else if (params.avgDailyDistance && params.avgDailyDistance > 0) {
      // ประมาณระยะทางจากจำนวนวันและระยะทางเฉลี่ยต่อวัน
      const estimatedDistance = daysDiff * params.avgDailyDistance;
      wearRatePer1000Km = estimatedDistance > 0 ? (depthDiff / estimatedDistance) * 1000 : 0;
    }
    
    // กำหนดระดับความเชื่อมั่นตามจำนวนข้อมูล
    confidenceLevel = sortedHistory.length >= 4 ? 'high' : 'medium';
  } 
  // 2. วิธีรองลงมา: ใช้ข้อมูลจากวันที่ติดตั้งถึงปัจจุบัน
  else if (purchaseDate && currentAgeDays > 0) {
    const depthDiff = initialDepth - currentDepth;
    wearRatePerDay = depthDiff / currentAgeDays;
    
    // คำนวณอัตราการสึกหรอต่อระยะทาง (ถ้ามีข้อมูลระยะทางเฉลี่ย)
    if (params.avgDailyDistance && params.avgDailyDistance > 0) {
      const estimatedDistance = currentAgeDays * params.avgDailyDistance;
      wearRatePer1000Km = (depthDiff / estimatedDistance) * 1000;
    }
    
    confidenceLevel = 'medium';
  } 
  // 3. วิธีที่แย่ที่สุด: ใช้ค่าเฉลี่ยทางสถิติ
  else {
    // ใช้ค่าเฉลี่ยหรือค่ามาตรฐาน
    wearRatePerDay = 0.05; // ค่าเฉลี่ยประมาณ 0.05 มม./วัน
    
    if (params.avgDailyDistance && params.avgDailyDistance > 0) {
      wearRatePer1000Km = 0.5; // ค่าเฉลี่ยประมาณ 0.5 มม./1000 กม.
    }
    
    confidenceLevel = 'low';
  }
  
  // ตรวจสอบสถานะปัจจุบัน
  let status = '';
  let statusCode: 'normal' | 'warning' | 'critical' | 'error' = 'normal';
  let recommendation = '';
  
  if (currentDepth <= LEGAL_LIMIT) {
    status = 'ต้องเปลี่ยนทันที (ต่ำกว่าเกณฑ์กฎหมาย)';
    statusCode = 'critical';
    recommendation = 'ควรเปลี่ยนยางทันที เนื่องจากความลึกดอกยางต่ำกว่าเกณฑ์ปลอดภัยตามกฎหมาย';
  } else if (currentDepth <= SAFETY_LIMIT) {
    status = 'แนะนำให้เปลี่ยน (เพื่อความปลอดภัย)';
    statusCode = 'warning';
    recommendation = 'ควรวางแผนเปลี่ยนยางในเร็วๆ นี้ เนื่องจ��กความลึกดอกยางต่ำกว่าเกณฑ์ความปลอดภัย';
  } else {
    status = 'ใช้งานได้ปกติ';
    statusCode = 'normal';
    recommendation = 'ยางมีสภาพดี สามารถใช้งานต่อได้ปกติ';
  }
  
  // คำนวณความลึกที่เหลือ
  const remainingDepthToLegal = Math.max(0, currentDepth - LEGAL_LIMIT);
  const remainingDepthToSafety = Math.max(0, currentDepth - SAFETY_LIMIT);
  
  // คาดการณ์จำนวนวันที่จะถึงเกณฑ์
  let daysToLegal = 0;
  let daysToSafety = 0;
  
  if (wearRatePerDay > 0) {
    daysToLegal = Math.max(0, Math.floor(remainingDepthToLegal / wearRatePerDay));
    daysToSafety = Math.max(0, Math.floor(remainingDepthToSafety / wearRatePerDay));
  } else {
    // ถ้าไม่สามารถคำนวณอัตราการสึกหรอได้
    daysToLegal = 9999; // ค่าตัวเลขสูงสำหรับแสดงว่าไม่สามารถคำนวณได้
    daysToSafety = 9999;
  }
  
  // คำนวณวันที่คาดว่าจะถึงเกณฑ์
  const predictedDateLegal = new Date();
  predictedDateLegal.setDate(predictedDateLegal.getDate() + daysToLegal);
  
  const predictedDateSafety = new Date();
  predictedDateSafety.setDate(predictedDateSafety.getDate() + daysToSafety);
  
  // สร้างคำอธิบายเพิ่มเติม
  let analysisResult = '';
  if (statusCode === 'critical') {
    analysisResult = 'ความลึกดอกยางอยู่ที่ ' + currentDepth.toFixed(1) + ' มม. ซึ่งต่ำกว่าเกณฑ์กฎหมายที่ ' + LEGAL_LIMIT + ' มม.';
  } else if (statusCode === 'warning') {
    analysisResult = 'ความลึกดอกยางอยู่ที่ ' + currentDepth.toFixed(1) + ' มม. ซึ่งต่ำกว่าเกณฑ์ความปลอดภัยที่ ' + SAFETY_LIMIT + ' มม. คาดว่าจะถึงเกณฑ์กฎหมายใน ' + daysToLegal + ' วัน';
  } else {
    analysisResult = 'ความลึกดอกยางอยู่ที่ ' + currentDepth.toFixed(1) + ' มม. คาดว่าจะถึงเกณฑ์ความปลอดภัยใน ' + daysToSafety + ' วัน และถึงเกณฑ์กฎหมายใน ' + daysToLegal + ' วัน';
  }
  
  // สร้างสูตรและวิธีการคำนวณที่ใช้
  const wearFormula = `อัตราการสึกหรอ: ${wearRatePerDay.toFixed(4)} มม./วัน, ${wearRatePer1000Km.toFixed(4)} มม./1000กม.`;
  const analysisMethod = 'การวิเคราะห์แบบมาตรฐาน ใช้ข้อมูลการวัด' + (params.measurementHistory ? `${params.measurementHistory.length} ครั้ง` : '1 ครั้ง');
  
  // Calculate the predicted wear percentage
  const predictedWearPercentage = ((initialDepth - currentDepth) / initialDepth) * 100;
  
  // Calculate the estimated remaining lifespan in kilometers
  let predictedLifespan: number | undefined;
  if (wearRatePer1000Km > 0) {
    predictedLifespan = (remainingDepthToLegal / wearRatePer1000Km) * 1000;
  }
  
  return {
    tireId: params.tireId,
    currentDepth,
    position: params.position,
    currentAgeDays,
    wearRatePerDay,
    wearRatePer1000Km,
    remainingDepthToLegal,
    remainingDepthToSafety,
    daysToLegal,
    daysToSafety,
    predictedDateLegal,
    predictedDateSafety,
    statusCode,
    status,
    analysisMethod,
    analysisResult,
    recommendation,
    wearFormula,
    confidenceLevel,
    predictedWearPercentage,
    predictedLifespan
  };
}

/**
 * คำนวณการสึกหรอโดยใช้การวิเคราะห์การถดถอย (Regression Analysis)
 */
function calculateStatisticalRegression(params: TireWearCalculationParams): TireWearAnalysisResult {
  // เริ่มต้นด้วยการคำนวณแบบมาตรฐาน
  const baseResult = calculateStandardPrediction(params);
  
  // ถ้ามีประวัติการวัดน้อยกว่า 3 ครั้ง ใช้ผลลัพธ์จากการคำนวณแบบมาตรฐาน
  if (!params.measurementHistory || params.measurementHistory.length < 3) {
    return {
      ...baseResult,
      analysisMethod: 'การวิเคราะห์ทางสถิติ (ข้อมูลไม่เพียงพอ จึงใช้การคำนวณแบบมาตรฐาน)',
      confidenceLevel: 'low'
    };
  }
  
  // เรียงลำดับข้อมูลตามวันที่
  const sortedHistory = [...params.measurementHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // เตรียมข้อมูลสำหรับการวิเคราะห์การถดถอย
  const xValues: number[] = []; // วัน (นับจาก 0 คือวันแรกที่วัด)
  const yValues: number[] = []; // ค่าความลึกดอกยาง
  
  const firstDate = new Date(sortedHistory[0].date).getTime();
  
  sortedHistory.forEach(item => {
    const daysFromFirst = (new Date(item.date).getTime() - firstDate) / (1000 * 3600 * 24);
    xValues.push(daysFromFirst);
    yValues.push(item.depth);
  });
  
  // คำนวณสัมประสิทธิ์การถดถอยเชิงเส้น (Linear Regression)
  const { slope, intercept } = linearRegression(xValues, yValues);
  
  // อัตราการสึกหรอต่อวันคือค่า slope ที่เป็นลบ (เพราะความลึกลดลงตามเวลา)
  const wearRatePerDay = -slope;
  
  // คำนวณอัตราการสึกหรอต่อระยะทาง
  let wearRatePer1000Km = 0;
  if (params.avgDailyDistance && params.avgDailyDistance > 0) {
    wearRatePer1000Km = (wearRatePerDay / params.avgDailyDistance) * 1000;
  }
  
  // จำนวนวันทั้งหมดที่มีข้อมูล
  const totalDays = xValues[xValues.length - 1] - xValues[0];
  
  // คำนวณค่า R-squared เพื่อประเมินความน่าเชื่อถือของโมเดล
  const rSquared = calculateRSquared(xValues, yValues, slope, intercept);
  
  // กำหนดระดับความเชื่อมั่น
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (sortedHistory.length >= 5 && rSquared > 0.7) {
    confidenceLevel = 'high';
  } else if (sortedHistory.length >= 3 && rSquared > 0.5) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
  }
  
  // คำนวณความลึกปัจจุบันตามโมเดล
  const currentDaysFromFirst = (new Date().getTime() - firstDate) / (1000 * 3600 * 24);
  const predictedCurrentDepth = intercept + slope * currentDaysFromFirst;
  
  // ใช้ค่าที่วัดได้จริงล่าสุดหรือค่าที่คำนวณได้จากโมเดล
  const usedCurrentDepth = params.treadDepth;
  
  // คำนวณวันที่จะถึงเกณฑ์ความปลอดภัยและเกณฑ์กฎหมาย
  const daysToLegal = wearRatePerDay > 0 ? Math.max(0, Math.floor((usedCurrentDepth - LEGAL_LIMIT) / wearRatePerDay)) : 9999;
  const daysToSafety = wearRatePerDay > 0 ? Math.max(0, Math.floor((usedCurrentDepth - SAFETY_LIMIT) / wearRatePerDay)) : 9999;
  
  // คำนวณวันที่คาดว่าจะถึงเกณฑ์
  const predictedDateLegal = new Date();
  predictedDateLegal.setDate(predictedDateLegal.getDate() + daysToLegal);
  
  const predictedDateSafety = new Date();
  predictedDateSafety.setDate(predictedDateSafety.getDate() + daysToSafety);
  
  // สร้างคำอธิบายเพิ่มเติม
  let analysisResult = '';
  let status = '';
  let statusCode: 'normal' | 'warning' | 'critical' | 'error' = 'normal';
  let recommendation = '';
  
  if (usedCurrentDepth <= LEGAL_LIMIT) {
    status = 'ต้องเปลี่ยนทันที (ต่ำกว่าเกณฑ์กฎหมาย)';
    statusCode = 'critical';
    recommendation = 'ควรเปลี่ยนยางทันที เนื่องจากความลึกดอกยางต่ำกว่าเกณฑ์ปลอดภัยตามกฎหมาย';
    analysisResult = `ความลึกดอกยางต่ำกว่าเกณฑ์กฎหมาย (${usedCurrentDepth.toFixed(1)} < ${LEGAL_LIMIT} มม.)`;
  } else if (usedCurrentDepth <= SAFETY_LIMIT) {
    status = 'แนะนำให้เปลี่ยน (เพื่อความปลอดภัย)';
    statusCode = 'warning';
    recommendation = 'ควรวางแผนเปลี่ยนยางภายใน 1-2 สัปดาห์';
    analysisResult = `ความลึกดอกยางต่ำกว่าเกณฑ์ความปลอดภัย (${usedCurrentDepth.toFixed(1)} < ${SAFETY_LIMIT} มม.) คาดว่าจะถึงเกณฑ์กฎหมายใน ${daysToLegal} วัน`;
  } else {
    status = 'ใช้งานได้ปกติ';
    statusCode = 'normal';
    recommendation = 'ยางมีสภาพดี สามารถใช้งานต่อได้ปกติ';
    analysisResult = `ความลึกดอกยางอยู่ในเกณฑ์ปกติ (${usedCurrentDepth.toFixed(1)} มม.) คาดว่าจะถึงเกณฑ์ความปลอดภัยใน ${daysToSafety} วัน และถึงเกณฑ์กฎหมายใน ${daysToLegal} วัน`;
  }
  
  // สร้างสูตรและวิธีการคำนวณที่ใช้
  const wearFormula = `สมการถดถอย: y = ${intercept.toFixed(2)} + (${slope.toFixed(4)} × วัน), R² = ${rSquared.toFixed(2)}`;
  const analysisMethod = `การวิเคราะห์ทางสถิติแบบการถดถอยเชิงเส้น (Linear Regression) จากข้อมูลการวัด ${sortedHistory.length} ครั้ง ในช่วง ${totalDays.toFixed(0)} วัน`;
  
  return {
    tireId: params.tireId,
    currentDepth: usedCurrentDepth,
    position: params.position,
    currentAgeDays: baseResult.currentAgeDays,
    wearRatePerDay,
    wearRatePer1000Km,
    remainingDepthToLegal: Math.max(0, usedCurrentDepth - LEGAL_LIMIT),
    remainingDepthToSafety: Math.max(0, usedCurrentDepth - SAFETY_LIMIT),
    daysToLegal,
    daysToSafety,
    predictedDateLegal,
    predictedDateSafety,
    statusCode,
    status,
    analysisMethod,
    analysisResult,
    recommendation,
    wearFormula,
    confidenceLevel,
    predictedWearPercentage: baseResult.predictedWearPercentage,
    predictedLifespan: baseResult.predictedLifespan
  };
}

/**
 * คำนวณการสึกหรอตามตำแหน่งการติดตั้งยาง
 */
function calculatePositionBased(params: TireWearCalculationParams): TireWearAnalysisResult {
  // เริ่มต้นด้วยการคำนวณแบบมาตรฐาน
  const baseResult = calculateStandardPrediction(params);
  
  // ถ้าไม่มีข้อมูลตำแหน่ง ใช้ผลลัพธ์จากการคำนวณแบบมาตรฐาน
  if (!params.position) {
    return {
      ...baseResult,
      analysisMethod: 'การวิเคราะห์ตามตำแหน่งติดตั้ง (ไม่ระบุตำแหน่ง จึงใช้การคำนวณแบบมาตรฐาน)',
      confidenceLevel: 'low'
    };
  }
  
  // กำหนดค่าสัมประสิทธิ์การสึกหรอตามตำแหน่ง (ตัวอย่าง, ค่าปรับตามข้อมูลจริง)
  const positionWearFactors: Record<string, number> = {
    // รถเล็ก
    'FL': 1.1,  // หน้าซ้าย - สึกเร็วกว่าปกติ
    'FR': 1.1,  // หน้าขวา - สึกเร็วกว่าปกติ
    'RL': 0.9,  // หลังซ้าย - สึกช้ากว่าปกติ
    'RR': 0.9,  // หลังขวา - สึกช้ากว่าปกติ
    
    // รถบรรทุก
    'FLO': 1.1,  // หน้าซ้ายนอก
    'FRO': 1.1,  // หน้าขวานอก
    'RLO': 1.0,  // หลังซ้ายนอก
    'RRO': 1.0,  // หลังขวานอก
    'RLI': 0.9,  // หลังซ้ายใน
    'RRI': 0.9,  // หลังขวาใน
    'RLI1': 0.9, // หลังซ้ายใน1
    'RRI1': 0.9, // หลังขวาใน1
    'RLI2': 0.85, // หลังซ้ายใน2
    'RRI2': 0.85, // หลังขวาใน2
  };
  
  // หาค่าสัมประสิทธิ์ตามตำแหน่ง หรือใช้ค่าเริ่มต้น (1.0) ถ้าไม่พบ
  const positionFactor = positionWearFactors[params.position] || 1.0;
  
  // ปรับอัตราการสึกหรอตามตำแหน่ง
  const adjustedWearRatePerDay = baseResult.wearRatePerDay * positionFactor;
  const adjustedWearRatePer1000Km = baseResult.wearRatePer1000Km * positionFactor;
  
  // คำนวณวันที่จะถึงเกณฑ์ความปลอดภัยและเกณฑ์กฎหมายใหม่
  const currentDepth = params.treadDepth;
  const daysToLegal = adjustedWearRatePerDay > 0 ? 
    Math.max(0, Math.floor((currentDepth - LEGAL_LIMIT) / adjustedWearRatePerDay)) : 9999;
  const daysToSafety = adjustedWearRatePerDay > 0 ? 
    Math.max(0, Math.floor((currentDepth - SAFETY_LIMIT) / adjustedWearRatePerDay)) : 9999;
  
  // คำนวณวันที่คาดว่าจะถึงเกณฑ์
  const predictedDateLegal = new Date();
  predictedDateLegal.setDate(predictedDateLegal.getDate() + daysToLegal);
  
  const predictedDateSafety = new Date();
  predictedDateSafety.setDate(predictedDateSafety.getDate() + daysToSafety);
  
  // สร้างคำอธิบายเพิ่มเติม
  const positionDescription = getPositionDescription(params.position);
  const positionFactorText = positionFactor > 1.0 ? 
    `สึกเร็วกว่าปกติ ${((positionFactor - 1) * 100).toFixed(0)}%` : 
    positionFactor < 1.0 ? 
    `สึกช้ากว่าปกติ ${((1 - positionFactor) * 100).toFixed(0)}%` : 
    `สึกหรอปกติ`;
  
  const analysisResult = `${baseResult.analysisResult} (ตำแหน่ง ${params.position}: ${positionDescription} ${positionFactorText})`;
  const wearFormula = `${baseResult.wearFormula} × ปัจจัยตำแหน่ง ${params.position}: ${positionFactor.toFixed(2)}`;
  const analysisMethod = `การวิเคราะห์ตามตำแหน่งติดตั้ง "${params.position}" (${positionDescription}) ปรับค่าจากการคำนวณมาตรฐาน`;
  
  return {
    ...baseResult,
    wearRatePerDay: adjustedWearRatePerDay,
    wearRatePer1000Km: adjustedWearRatePer1000Km,
    daysToLegal,
    daysToSafety,
    predictedDateLegal,
    predictedDateSafety,
    analysisMethod,
    analysisResult,
    wearFormula,
    predictedWearPercentage: baseResult.predictedWearPercentage
  };
}

/**
 * ฟังก์ชันช่วยคำนวณการถดถอยเชิงเส้น (Linear Regression)
 */
function linearRegression(xValues: number[], yValues: number[]) {
  const n = xValues.length;
  
  // คำนวณค่าเฉลี่ย
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  // คำนวณ slope (m) และ y-intercept (b)
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) * (xValues[i] - xMean);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  return { slope, intercept };
}

/**
 * ฟังก์ชันคำนวณค่า R-squared เพื่อวัดความน่าเชื่อถือของโมเดลการถดถอย
 */
function calculateRSquared(xValues: number[], yValues: number[], slope: number, intercept: number) {
  const n = xValues.length;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  let totalSS = 0; // Total sum of squares
  let residualSS = 0; // Residual sum of squares
  
  for (let i = 0; i < n; i++) {
    const predictedY = intercept + slope * xValues[i];
    totalSS += Math.pow(yValues[i] - yMean, 2);
    residualSS += Math.pow(yValues[i] - predictedY, 2);
  }
  
  return totalSS !== 0 ? 1 - (residualSS / totalSS) : 0;
}

/**
 * ฟังก์ชันแปลงรหัสตำแหน่งยางเป็นคำอธิบาย
 */
function getPositionDescription(position: string | undefined): string {
  if (!position) return "ไม่ระบุตำแหน่ง";
  
  const positionDescriptions: Record<string, string> = {
    'FL': 'หน้าซ้าย',
    'FR': 'หน้าขวา',
    'RL': 'หลังซ้าย',
    'RR': 'หลังขวา',
    'FLO': 'หน้าซ้ายนอก',
    'FRO': 'หน้าขวานอก',
    'RLO': 'หลังซ้ายนอก',
    'RRO': 'หลังขวานอก',
    'RLI': 'หลังซ้ายใน',
    'RRI': 'หลังขวาใน',
    'RLI1': 'หลังซ้ายใน1',
    'RRI1': 'หลังขวาใน1',
    'RLI2': 'หลังซ้ายใน2',
    'RRI2': 'หลังขวาใน2'
  };
  
  return positionDescriptions[position] || position;
}
