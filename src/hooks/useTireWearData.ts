
import { useState, useEffect } from "react";
import { Tire, Vehicle, TireWearCalculation } from "@/types/models";
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
        currentMileage: vehicle.current_mileage,
        notes: vehicle.notes,
        tirePositions: []
      })) || [];

      const formattedCalculations: TireWearCalculation[] = historyData?.map(calc => ({
        id: calc.id,
        calculation_date: calc.calculation_date,
        current_mileage: calc.current_mileage,
        current_age_days: calc.current_age_days,
        tread_depth_mm: calc.tread_depth_mm,
        predicted_wear_percentage: calc.predicted_wear_percentage,
        predicted_lifespan: calc.predicted_lifespan,
        wear_formula: calc.wear_formula,
        status_code: calc.status_code as 'normal' | 'warning' | 'critical' | 'error' | undefined,
        tire_id: calc.tire_id,
        vehicle_id: calc.vehicle_id,
        analysis_method: calc.analysis_method,
        analysis_result: calc.analysis_result,
        analysis_type: calc.analysis_type,
        recommendation: calc.recommendation,
        notes: calc.notes || undefined,
        created_at: calc.created_at,
        updated_at: calc.updated_at
      })) || [];
      
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
