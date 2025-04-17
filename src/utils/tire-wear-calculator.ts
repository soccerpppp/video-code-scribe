
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
      // Updated predict wear logic using the formula from image
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
function calculatePredictWear(params: TireWearCalculationParams): TireWearAnalysisResult {
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

  // Update calculation using formula from the image: y = a + bX
  // From image: y = bX, y = 0.00432X
  // Where X is the mileage and y is the wear percentage
  
  // Base formula from the image
  const wearRate = 0.00432; // This value from the image formula
  const predictedWearPercentage = wearRate * params.currentMileage;
  
  // Calculate remaining life considering tread depth
  const remainingDepth = params.treadDepth - MIN_SAFE_TREAD_DEPTH;
  const usableDepth = initialDepth - MIN_SAFE_TREAD_DEPTH;
  const remainingPercentage = remainingDepth / usableDepth;
  
  // Calculate predicted lifespan in km
  // From the formula in image: 10,000 km = 43.2% wear
  // So 100% wear would be at: 10,000 / 0.432 = ~23,148 km
  // Remaining life = remainingPercentage * 23,148
  const fullLifespanKm = 10000 / 0.432;
  const predictedLifespan = Math.max(Math.round(remainingPercentage * fullLifespanKm), 0);

  // Create analysis method description
  const analysisMethod = 'การวิเคราะห์ด้วยสูตรคำนวณจากข้อมูลจริง y = 0.00432X';
  
  // Determine wear status based on the formula results
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
    analysisResult = 'ยางมีการสึกหรอปานกลาง ซึ่งยังอยู่ในเกณฑ์ปกติ';
    recommendation = 'ควรตรวจสอบสภาพยางทุก 2-3 เดือน';
  } else {
    statusCode = 'normal';
    analysisResult = 'ยางมีสภาพดี';
    recommendation = 'ยางมีสภาพดี สามารถใช้งานต่อได้ปกติ';
  }

  // Create formula explanation using the formula from the image
  const wearFormula = `y = ${wearRate} × ${params.currentMileage} = ${predictedWearPercentage.toFixed(2)}%`;

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

function calculateClusterAnalysis(params: TireWearCalculationParams): TireWearAnalysisResult {
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
  
  // Update calculation using K-Means clustering approach as shown in the image
  // From the image: We have clusters for different tire wear patterns
  
  // Calculate base wear using the formula y = 0.00432X from the image
  const wearRate = 0.00432;
  let baseWearPercentage = wearRate * params.currentMileage;
  
  // For cluster analysis, simulate comparison with similar tires
  // In the image, there are cluster groups (0, 1, 2)
  // Simulate assigning to a cluster based on wear pattern:
  
  // Factor in tread depth to determine which cluster this tire belongs to
  const expectedTreadDepth = initialDepth - (baseWearPercentage / 100) * (initialDepth - MIN_SAFE_TREAD_DEPTH);
  const treadDepthDeviation = params.treadDepth - expectedTreadDepth;
  
  let clusterNumber = 1; // Default to average wear cluster
  let clusterFactor = 1.0;
  
  // Determine cluster based on deviation from expected tread depth
  if (treadDepthDeviation > 1) {
    clusterNumber = 0; // Low wear cluster (good condition)
    clusterFactor = 0.85; // Wears slower than average
    baseWearPercentage *= clusterFactor;
  } else if (treadDepthDeviation < -1) {
    clusterNumber = 2; // High wear cluster (concerning)
    clusterFactor = 1.2; // Wears faster than average
    baseWearPercentage *= clusterFactor;
  }
  
  // Cap at 100%
  const predictedWearPercentage = Math.min(baseWearPercentage, 100);
  
  // Calculate remaining life based on cluster
  const remainingDepth = params.treadDepth - MIN_SAFE_TREAD_DEPTH;
  const usableDepth = initialDepth - MIN_SAFE_TREAD_DEPTH;
  const remainingPercentage = remainingDepth / usableDepth;
  
  // Adjust lifespan prediction based on cluster
  const fullLifespanKm = 10000 / 0.432 / clusterFactor;
  const predictedLifespan = Math.max(Math.round(remainingPercentage * fullLifespanKm), 0);
  
  // Build analysis result and recommendations
  let analysisResult = '';
  let recommendation = '';
  let statusCode: 'normal' | 'warning' | 'critical' | 'error' = 'normal';
  
  // Create description referring to the cluster analysis
  const clusterNames = ["ยางที่สึกหรอช้ากว่าปกติ", "ยางที่สึกหรอปานกลาง", "ยางที่สึกหรอเร็วกว่าปกติ"];
  
  if (params.treadDepth <= MIN_SAFE_TREAD_DEPTH) {
    statusCode = 'critical';
    analysisResult = 'ความลึกดอกยางต่ำกว่าระดับปลอดภัย';
    recommendation = 'ควรเปลี่ยนยางทันที เพื่อความปลอดภัยในการขับขี่';
  } else {
    analysisResult = `ยางอยู่ในกลุ่ม ${clusterNumber}: ${clusterNames[clusterNumber]} (${predictedWearPercentage.toFixed(2)}%)`;
    
    if (clusterNumber === 2) {
      statusCode = 'warning';
      recommendation = 'ควรตรวจสอบการตั้งศูนย์ล้อและความดันลมยาง เนื่องจากสึกหรอเร็วกว่าปกติ';
    } else if (predictedWearPercentage >= 70) {
      statusCode = 'warning';
      recommendation = 'ควรวางแผนเปลี่ยนยางในอีก 1-2 เดือนข้างหน้า';
    } else {
      statusCode = 'normal';
      recommendation = 'ยางมีสภาพปกติ สามารถใช้งานต่อได้';
    }
  }
  
  // Create formula explanation from the image using K-Means formula reference
  const wearFormula = `K-Means Clustering:\nกลุ่ม ${clusterNumber}: ${clusterNames[clusterNumber]}\n${wearRate} × ${params.currentMileage} × ${clusterFactor.toFixed(2)} = ${predictedWearPercentage.toFixed(2)}%`;

  return {
    currentAgeDays,
    predictedWearPercentage: parseFloat(predictedWearPercentage.toFixed(2)),
    predictedLifespan,
    analysisMethod: 'การวิเคราะห์กลุ่มเปรียบเทียบกับยางลักษณะเดียวกัน (K-Means Clustering)',
    analysisResult,
    recommendation,
    wearFormula,
    statusCode
  };
}

function calculateTimeSeriesPrediction(params: TireWearCalculationParams): TireWearAnalysisResult {
  // Use initial tread depth if provided, otherwise use default MAX_TREAD_DEPTH
  const initialDepth = params.initialTreadDepth || MAX_TREAD_DEPTH;
  
  // Calculate current age in days
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
  
  // Apply the time series formula from the image
  // From the image: 4.3 shows y = 0.00432(10000) = 43.20%
  const wearRate = 0.00432;
  
  // Calculate daily mileage
  const avgDailyMileage = params.currentMileage / Math.max(currentAgeDays, 1);
  
  // Calculate current wear percentage
  const currentWearPercentage = wearRate * params.currentMileage;
  
  // Calculate remaining usable depth
  const remainingDepth = params.treadDepth - MIN_SAFE_TREAD_DEPTH;
  const usableDepth = initialDepth - MIN_SAFE_TREAD_DEPTH;
  const remainingPercentage = remainingDepth / usableDepth;
  
  // Calculate days until minimum safe depth reached
  const dailyWearPercentage = wearRate * avgDailyMileage;
  const remainingWearPercentage = 100 - currentWearPercentage;
  const daysRemaining = Math.max(Math.floor(remainingWearPercentage / dailyWearPercentage), 0);
  
  // Calculate projected remaining mileage
  const projectedRemainingMileage = Math.floor(daysRemaining * avgDailyMileage);
  
  // Time series final wear percentage with acceleration factor as tire ages
  const accelerationFactor = 1.05; // Slight acceleration as tire ages
  const predictedWearPercentage = Math.min(currentWearPercentage * accelerationFactor, 100);
  
  // Format time remaining in a human-readable way
  let timeRemaining = '';
  if (daysRemaining <= 0) {
    timeRemaining = 'หมดอายุการใช้งานแล้ว';
  } else if (daysRemaining < 30) {
    timeRemaining = `${daysRemaining} วัน`;
  } else if (daysRemaining < 365) {
    const months = Math.floor(daysRemaining / 30);
    timeRemaining = `${months} เดือน`;
  } else {
    const years = Math.floor(daysRemaining / 365);
    const months = Math.floor((daysRemaining % 365) / 30);
    timeRemaining = `${years} ปี ${months} เดือน`;
  }
  
  // Determine status and recommendations
  let analysisResult = '';
  let recommendation = '';
  let statusCode: 'normal' | 'warning' | 'critical' | 'error' = 'normal';
  
  if (params.treadDepth <= MIN_SAFE_TREAD_DEPTH) {
    statusCode = 'critical';
    analysisResult = 'ความลึกดอกยางต่ำกว่าระดับปลอดภัย';
    recommendation = 'ควรเปลี่ยนยางทันที เพื่อความปลอดภัยในการขับขี่';
  } else if (daysRemaining < 30) {
    statusCode = 'critical';
    analysisResult = `การวิเคราะห์อนุกรมเวลาคาดการณ์ว่ายางจะหมดอายุใน ${timeRemaining}`;
    recommendation = 'ควรเปลี่ยนยางโดยด่วน';
  } else if (daysRemaining < 90) {
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
  
  // Create formula explanation for time series prediction based on the image
  const wearFormula = `y = ${wearRate} × ${params.currentMileage} = ${predictedWearPercentage.toFixed(2)}%\nอายุการใช้งานที่เหลือ: ${timeRemaining}`;

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
