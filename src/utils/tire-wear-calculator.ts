interface TireWearCalculationParams {
  tireId: string;
  vehicleId: string;
  currentMileage: number;
  treadDepth: number;
  purchaseDate?: string; // Optional purchase date if available
  initialTreadDepth?: number; // Initial tread depth when new
  analysisType?: 'predict_wear' | 'cluster_analysis' | 'time_series_prediction';
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

// Constants for calculation
const MAX_TREAD_DEPTH = 10; // mm for a new tire
const MIN_SAFE_TREAD_DEPTH = 1.6; // mm - minimum legal tread depth
const AVG_TIRE_LIFESPAN_KM = 60000; // average tire lifespan in km
const WEAR_COEFFICIENT = 1.25; // coefficient to adjust wear rate based on real data

export const calculateTireWear = (params: TireWearCalculationParams): TireWearAnalysisResult => {
  // Default to 'predict_wear' if no analysis type is specified
  const analysisType = params.analysisType || 'predict_wear';

  switch (analysisType) {
    case 'predict_wear':
      // Existing predict wear logic
      const predictWearResult = calculatePredictWear(params);
      return {
        ...predictWearResult,
        analysisMethod: 'การทำนายการสึกหรอแบบมาตรฐาน',
      };

    case 'cluster_analysis':
      // Cluster Analysis calculation logic
      return {
        ...calculateClusterAnalysis(params),
        analysisMethod: 'การวิเคราะห์กลุ่มด้วยข้อมูลการใช้งาน',
      };

    case 'time_series_prediction':
      // Time Series Prediction calculation logic
      return {
        ...calculateTimeSeriesPrediction(params),
        analysisMethod: 'การทำนายแนวโน้มการสึกหรอด้วยอนุกรมเวลา',
      };

    default:
      throw new Error('Invalid analysis type');
  }
};

// Helper functions for different analysis methods
function calculatePredictWear(params: TireWearCalculationParams): Partial<TireWearAnalysisResult> {
  // Existing predict wear calculation logic
  // Use initial tread depth if provided, otherwise use default MAX_TREAD_DEPTH
  const initialDepth = params.initialTreadDepth || MAX_TREAD_DEPTH;
  
  // Calculate tire age in days
  let currentAgeDays = 0;
  if (params.purchaseDate) {
    const purchaseDate = new Date(params.purchaseDate);
    const currentDate = new Date();
    currentAgeDays = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
  } else {
    // If no purchase date provided, estimate based on tread wear
    const wearRatio = (initialDepth - params.treadDepth) / initialDepth;
    currentAgeDays = Math.floor(wearRatio * 365 * 2); // Assume ~2 years lifespan
  }

  // Calculate wear using the enhanced formula from Google Colab
  // Basic formula: wear percentage = (initial depth - current depth) / (initial depth - minimum safe depth) * 100
  // Enhanced with age and mileage factors
  const depthLost = initialDepth - params.treadDepth;
  const usableDepth = initialDepth - MIN_SAFE_TREAD_DEPTH;
  
  // Base wear calculation as percentage of usable depth
  let predictedWearPercentage = (depthLost / usableDepth) * 100;
  
  // Apply age factor - older tires wear slightly faster
  const ageFactor = 1 + (currentAgeDays / 1095) * 0.2; // Up to 20% more wear after 3 years
  
  // Apply mileage factor - high mileage can accelerate wear
  const mileageFactor = 1 + (params.currentMileage / AVG_TIRE_LIFESPAN_KM) * 0.15;
  
  // Apply overall wear coefficient
  predictedWearPercentage = predictedWearPercentage * ageFactor * mileageFactor * WEAR_COEFFICIENT;
  
  // Cap at 100%
  predictedWearPercentage = Math.min(predictedWearPercentage, 100);
  
  // Calculate remaining life
  const remainingDepth = params.treadDepth - MIN_SAFE_TREAD_DEPTH;
  const remainingPercentage = remainingDepth / usableDepth;
  const predictedLifespan = Math.max(Math.round(remainingPercentage * AVG_TIRE_LIFESPAN_KM), 0);

  // Create analysis method description
  const analysisMethod = 'การวิเคราะห์แบบผสมผสานหลายปัจจัย (ความลึกดอกยาง, อายุ, ระยะทาง)';
  
  // Determine wear status
  let analysisResult = '';
  let recommendation = '';
  let statusCode: 'normal' | 'warning' | 'critical' | 'error' = 'normal';

  if (params.treadDepth <= MIN_SAFE_TREAD_DEPTH) {
    statusCode = 'critical';
    analysisResult = 'ความลึกดอกยางต่ำกว่าระดับปลอดภัย';
    recommendation = 'ควรเปลี่ยนยางทันที เพื่อความปลอดภัยในการขับขี่';
  } else if (predictedWearPercentage >= 85) {
    statusCode = 'critical';
    analysisResult = 'ยางมีการสึกหรอในระดับวิกฤต';
    recommendation = 'ควรเปลี่ยนยางภายใน 1-2 สัปดาห์';
  } else if (predictedWearPercentage >= 70) {
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

  // Create formula explanation
  const wearFormula = `[(${initialDepth} - ${params.treadDepth}) ÷ (${initialDepth} - ${MIN_SAFE_TREAD_DEPTH})] × 100 × ${ageFactor.toFixed(2)} × ${mileageFactor.toFixed(2)} = ${predictedWearPercentage.toFixed(2)}%`;

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
}

function calculateClusterAnalysis(params: TireWearCalculationParams): Partial<TireWearAnalysisResult> {
  // Use initial tread depth if provided, otherwise use default MAX_TREAD_DEPTH
  const initialDepth = params.initialTreadDepth || MAX_TREAD_DEPTH;
  
  // Calculate tire age in days similar to predict wear
  let currentAgeDays = 0;
  if (params.purchaseDate) {
    const purchaseDate = new Date(params.purchaseDate);
    const currentDate = new Date();
    currentAgeDays = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
  } else {
    // If no purchase date provided, estimate based on tread wear
    const wearRatio = (initialDepth - params.treadDepth) / initialDepth;
    currentAgeDays = Math.floor(wearRatio * 365 * 2); // Assume ~2 years lifespan
  }
  
  // Calculate base wear similar to predict wear
  const depthLost = initialDepth - params.treadDepth;
  const usableDepth = initialDepth - MIN_SAFE_TREAD_DEPTH;
  
  // Base wear calculation
  let baseWearPercentage = (depthLost / usableDepth) * 100;
  
  // For cluster analysis, we simulate comparison to similar vehicles/tires
  // In a real system, this would use machine learning clusters or segment data
  
  // Simulated cluster data - in real implementation, this would come from a database or ML model
  const avgWearForMileage = (params.currentMileage / AVG_TIRE_LIFESPAN_KM) * 100 * 0.9; // Expected wear at this mileage
  
  // Compare actual wear to expected wear for this vehicle type
  const wearDeviation = baseWearPercentage - avgWearForMileage;
  
  // Apply deviation factor to determine wear level relative to similar vehicles
  let predictedWearPercentage = baseWearPercentage;
  
  // Adjusting wear prediction based on cluster deviation
  if (wearDeviation > 20) {
    // This tire is wearing much faster than similar tires
    predictedWearPercentage = baseWearPercentage * 1.15; // Accelerated wear projection
  } else if (wearDeviation < -20) {
    // This tire is wearing slower than similar tires
    predictedWearPercentage = baseWearPercentage * 0.9; // Reduced wear projection
  }
  
  // Cap at 100%
  predictedWearPercentage = Math.min(predictedWearPercentage, 100);
  
  // Calculate remaining life
  const remainingDepth = params.treadDepth - MIN_SAFE_TREAD_DEPTH;
  const remainingPercentage = remainingDepth / usableDepth;
  const predictedLifespan = Math.max(Math.round(remainingPercentage * AVG_TIRE_LIFESPAN_KM * (wearDeviation < 0 ? 1.1 : 0.9)), 0);
  
  // Build analysis result and recommendations
  let analysisResult = '';
  let recommendation = '';
  let statusCode: 'normal' | 'warning' | 'critical' | 'error' = 'normal';
  
  if (params.treadDepth <= MIN_SAFE_TREAD_DEPTH) {
    statusCode = 'critical';
    analysisResult = 'ความลึกดอกยางต่ำกว่าระดับปลอดภัย';
    recommendation = 'ควรเปลี่ยนยางทันที เพื่อความปลอดภัยในการขับขี่';
  } else if (wearDeviation > 30) {
    statusCode = 'warning';
    analysisResult = `ยางสึกหรอเร็วกว่าค่าเฉลี่ยของกลุ่มอย่างมีนัยสำคัญ (${Math.round(wearDeviation)}% เร็วกว่าปกติ)`;
    recommendation = 'ควรตรวจสอบการตั้งศูนย์ล้อ, ความดันลมยาง และรูปแบบการขับขี่';
  } else if (wearDeviation < -30) {
    statusCode = 'normal';
    analysisResult = `ยางสึกหรอช้ากว่าค่าเฉลี่ยของกลุ่ม (${Math.round(-wearDeviation)}% ช้ากว่าปกติ)`;
    recommendation = 'คุณภาพยางและการใช้งานอยู่ในเกณฑ์ดี';
  } else if (predictedWearPercentage >= 80) {
    statusCode = 'critical';
    analysisResult = 'เมื่อเทียบกับกลุ่มเดียวกัน ยางมีการสึกหรอในระดับวิกฤต';
    recommendation = 'ควรเปลี่ยนยางภายใน 1-2 สัปดาห์';
  } else if (predictedWearPercentage >= 65) {
    statusCode = 'warning';
    analysisResult = 'เมื่อเทียบกับกลุ่มเดียวกัน ยางมีการสึกหรอในระดับสูง';
    recommendation = 'ควรวางแผนเปลี่ยนยางในอีก 1-2 เดือนข้างหน้า';
  } else {
    statusCode = 'normal';
    analysisResult = 'เมื่อเทียบกับกลุ่มเดียวกัน ยางมีการสึกหรอในระดับปกติ';
    recommendation = 'ยางมีสภาพดี สามารถใช้งานต่อได้ปกติ';
  }
  
  // Create formula explanation for cluster analysis
  const wearFormula = `[(${initialDepth} - ${params.treadDepth}) ÷ (${initialDepth} - ${MIN_SAFE_TREAD_DEPTH})] × 100 + ค่าเบี่ยงเบนจากกลุ่ม ${wearDeviation.toFixed(2)}% = ${predictedWearPercentage.toFixed(2)}%`;

  return {
    currentAgeDays,
    predictedWearPercentage: parseFloat(predictedWearPercentage.toFixed(2)),
    predictedLifespan,
    analysisMethod: 'การวิเคราะห์กลุ่มเปรียบเทียบกับยางลักษณะเดียวกัน',
    analysisResult,
    recommendation,
    wearFormula,
    statusCode
  };
}

function calculateTimeSeriesPrediction(params: TireWearCalculationParams): Partial<TireWearAnalysisResult> {
  // Use initial tread depth if provided, otherwise use default MAX_TREAD_DEPTH
  const initialDepth = params.initialTreadDepth || MAX_TREAD_DEPTH;
  
  // Calculate current wear
  const depthLost = initialDepth - params.treadDepth;
  const usableDepth = initialDepth - MIN_SAFE_TREAD_DEPTH;
  
  // Current age of the tire in days
  let currentAgeDays = 0;
  if (params.purchaseDate) {
    const purchaseDate = new Date(params.purchaseDate);
    const currentDate = new Date();
    currentAgeDays = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24));
  } else {
    // If no purchase date provided, estimate based on tread wear
    const wearRatio = (initialDepth - params.treadDepth) / initialDepth;
    currentAgeDays = Math.floor(wearRatio * 365 * 2); // Assume ~2 years lifespan
  }
  
  // For time series analysis, we would normally use historical measurements
  // Here we simulate multiple time points based on current data
  
  // Simulated daily wear rate (depth lost per day)
  let dailyWearRate = depthLost / Math.max(currentAgeDays, 1);
  
  // Apply acceleration factors to better simulate real-world wear patterns
  // Wear rate usually increases over time
  const ageAccelerationFactor = 1 + (currentAgeDays / 365) * 0.1; // 10% faster wear per year
  
  // Adjust wear rate for mileage intensity
  const avgDailyMileage = params.currentMileage / Math.max(currentAgeDays, 1);
  const mileageIntensityFactor = avgDailyMileage > 50 ? 1.2 : 1.0; // High daily mileage accelerates wear
  
  // Final adjusted daily wear rate
  const adjustedDailyWearRate = dailyWearRate * ageAccelerationFactor * mileageIntensityFactor;
  
  // Project into future - days until minimum safe depth
  const remainingUsableDepth = params.treadDepth - MIN_SAFE_TREAD_DEPTH;
  const projectedDaysRemaining = Math.max(Math.floor(remainingUsableDepth / adjustedDailyWearRate), 0);
  
  // Calculate estimated lifespan in km
  // Estimated based on current average daily mileage
  const projectedRemainingMileage = Math.floor(projectedDaysRemaining * avgDailyMileage);
  
  // Calculate wear percentage based on projected wear rate
  // This simulates time series prediction of wear percentage
  const baseWearPercentage = (depthLost / usableDepth) * 100;
  
  // For time series, we adjust the projection based on accelerating factors
  let predictedWearPercentage = baseWearPercentage;
  
  // Consider seasonal effects and wear acceleration
  // In real implementation, this would use actual time series data
  const seasonalFactor = 1.05; // Simulate slight seasonal effect
  const accelerationFactor = 1 + (baseWearPercentage / 100) * 0.3; // Wear accelerates as tire ages
  
  predictedWearPercentage = predictedWearPercentage * seasonalFactor * accelerationFactor;
  
  // Cap at 100%
  predictedWearPercentage = Math.min(predictedWearPercentage, 100);
  
  // Build analysis result and recommendations
  let analysisResult = '';
  let recommendation = '';
  let statusCode: 'normal' | 'warning' | 'critical' | 'error' = 'normal';
  
  // Projected time in human-readable format
  let timeRemaining = '';
  if (projectedDaysRemaining <= 0) {
    timeRemaining = 'หมดอายุการใช้งานแล้ว';
  } else if (projectedDaysRemaining < 30) {
    timeRemaining = `${projectedDaysRemaining} วัน`;
  } else if (projectedDaysRemaining < 365) {
    const months = Math.floor(projectedDaysRemaining / 30);
    timeRemaining = `${months} เดือน`;
  } else {
    const years = Math.floor(projectedDaysRemaining / 365);
    const months = Math.floor((projectedDaysRemaining % 365) / 30);
    timeRemaining = `${years} ปี ${months} เดือน`;
  }
  
  if (params.treadDepth <= MIN_SAFE_TREAD_DEPTH) {
    statusCode = 'critical';
    analysisResult = 'ความลึกดอกยางต่ำกว่าระดับปลอดภัย';
    recommendation = 'ควรเปลี่ยนยางทันที เพื่อความปลอดภัยในการขับขี่';
  } else if (projectedDaysRemaining < 30) {
    statusCode = 'critical';
    analysisResult = `การวิเคราะห์อนุกรมเวลาคาดการณ์ว่ายางจะหมดอายุใน ${timeRemaining}`;
    recommendation = 'ควรเปลี่ยนยางโดยด่วน';
  } else if (projectedDaysRemaining < 90) {
    statusCode = 'warning';
    analysisResult = `การวิเคราะห์อนุกรมเวลาคาดการณ์ว่ายางจะหมดอายุใน ${timeRemaining}`;
    recommendation = 'ควรวางแผนเปลี่ยนยางในเร็วๆ นี้';
  } else {
    statusCode = 'normal';
    analysisResult = `การวิเคราะห์อนุกรมเวลาคาดการณ์ว่ายางจะหมดอายุใน ${timeRemaining}`;
    recommendation = 'ยางมีสภาพดี สามารถใช้งานต่อได้ปกติ';
  }
  
  // Add daily mileage info to analysis
  analysisResult += ` (ใช้งานเฉลี่ย ${Math.round(avgDailyMileage)} กม./วัน)`;
  
  // Create formula explanation for time series prediction
  const wearFormula = `อัตราการสึกหรอ ${adjustedDailyWearRate.toFixed(4)} มม./วัน × ${projectedDaysRemaining} วัน = ${predictedWearPercentage.toFixed(2)}%`;

  return {
    currentAgeDays,
    predictedWearPercentage: parseFloat(predictedWearPercentage.toFixed(2)),
    predictedLifespan: projectedRemainingMileage,
    analysisMethod: 'การวิเคราะห์อนุกรมเวลาพิจารณาจากอัตราการสึกหรอต่อวัน',
    analysisResult,
    recommendation,
    wearFormula,
    statusCode
  };
}
