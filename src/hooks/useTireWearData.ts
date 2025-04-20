import { useState, useEffect } from "react";
import { Tire, Vehicle, TireWearCalculation, TireWearAnalysisTypeUnified } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useTireWearData = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [calculationResults, setCalculationResults] = useState<TireWearCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('*')
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;

      const { data: historyData, error: historyError } = await supabase
        .from('tire_wear_calculations')
        .select('*')
        .order('calculation_date', { ascending: false });
      
      if (historyError) throw historyError;
      
      const formattedTires: Tire[] = tiresData?.map(tire => ({
        id: tire.id,
        serialNumber: tire.serial_number,
        brand: tire.brand,
        model: tire.model,
        size: tire.size,
        type: tire.type as 'new' | 'retreaded',
        position: tire.position,
        vehicleId: tire.vehicle_id,
        purchaseDate: tire.purchase_date,
        purchasePrice: tire.purchase_price,
        supplier: tire.supplier,
        status: tire.status as 'active' | 'maintenance' | 'retreading' | 'expired' | 'sold',
        treadDepth: tire.tread_depth,
        mileage: tire.mileage,
        notes: tire.notes
      })) || [];
      
      const formattedVehicles: Vehicle[] = vehiclesData?.map(vehicle => ({
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        brand: vehicle.brand,
        model: vehicle.model,
        type: vehicle.type,
        wheelPositions: vehicle.wheel_positions,
        initialMileage: vehicle.initial_mileage,
        currentMileage: vehicle.current_mileage,
        measurementStartDate: vehicle.measurement_start_date,
        dailyMileageIncrement: vehicle.daily_mileage_increment,
        notes: vehicle.notes,
        tirePositions: []
      })) || [];

      console.log("Raw calculation data from DB:", historyData?.[0]);

      const formattedCalculations: TireWearCalculation[] = historyData?.map(calc => {
        const predictedLifespan = calc.current_mileage * (1 / (calc.predicted_wear_percentage / 100));
        const wearFormula = `${calc.analysis_method}: ${calc.tread_depth_mm}mm / ${calc.current_mileage}km`;
        let statusCode: 'normal' | 'warning' | 'critical' | 'error' | undefined = undefined;
        
        if (calc.predicted_wear_percentage >= 80) {
          statusCode = 'critical';
        } else if (calc.predicted_wear_percentage >= 60) {
          statusCode = 'warning';
        } else if (calc.predicted_wear_percentage >= 0) {
          statusCode = 'normal';
        }
        
        const validAnalysisType = mapAnalysisType(calc.analysis_type);
        
        return {
          id: calc.id,
          calculation_date: calc.calculation_date,
          current_mileage: calc.current_mileage,
          current_age_days: calc.current_age_days,
          tread_depth_mm: calc.tread_depth_mm,
          predicted_wear_percentage: calc.predicted_wear_percentage,
          predicted_lifespan: predictedLifespan,
          wear_formula: wearFormula,
          status_code: statusCode,
          tire_id: calc.tire_id,
          vehicle_id: calc.vehicle_id,
          analysis_method: calc.analysis_method,
          analysis_result: calc.analysis_result,
          analysis_type: validAnalysisType,
          recommendation: calc.recommendation,
          notes: calc.notes || undefined,
          created_at: calc.created_at,
          updated_at: calc.updated_at
        };
      }) || [];
      
      setTires(formattedTires);
      setVehicles(formattedVehicles);
      setCalculationResults(formattedCalculations);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mapAnalysisType = (type: string): TireWearAnalysisTypeUnified => {
    const validTypes: TireWearAnalysisTypeUnified[] = [
      'predict_wear',
      'cluster_analysis',
      'time_series_prediction',
      'standard_prediction', 
      'statistical_regression',
      'position_based'
    ];
    
    if (validTypes.includes(type as TireWearAnalysisTypeUnified)) {
      return type as TireWearAnalysisTypeUnified;
    }
    
    console.warn(`Invalid analysis type: ${type}, defaulting to 'predict_wear'`);
    return 'predict_wear';
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    tires,
    vehicles,
    calculationResults,
    isLoading,
    refreshData: fetchData
  };
};
