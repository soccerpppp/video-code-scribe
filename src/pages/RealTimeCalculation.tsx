
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TireWearCalculationForm } from "@/components/tire-wear/TireWearCalculationForm";
import { TireWearResultDialog } from "@/components/tire-wear/TireWearResultDialog";
import { TireWearHistoryPanel } from "@/components/tire-wear/TireWearHistoryPanel";
import { calculateTireWear } from "@/utils/tire-wear-calculator";
import { Tire, Vehicle, TireWearCalculation } from "@/types/models";

interface TireFromDB {
  id: string;
  serial_number: string;
  brand: string;
  model: string;
  size: string;
  type: string;
  position: string | null;
  vehicle_id: string | null;
  purchase_date: string;
  purchase_price: number;
  supplier: string;
  status: string;
  tread_depth: number;
  mileage: number;
  notes?: string;
}

interface VehicleFromDB {
  id: string;
  registration_number: string;
  brand: string;
  model: string;
  type: string;
  wheel_positions: number;
  current_mileage: number;
  notes?: string;
}

interface TireWearCalculationFromDB {
  id: string;
  calculation_date: string;
  current_mileage: number;
  current_age_days: number;
  tread_depth_mm: number;
  predicted_wear_percentage: number;
  tire_id: string;
  vehicle_id: string;
  created_at: string;
  recommendation: string;
  updated_at: string;
  analysis_method: string;
  notes: string;
  analysis_result: string;
  analysis_type: string; // Changed from the specific union type to string to match DB response
}

const RealTimeCalculation: React.FC = () => {
  const navigate = useNavigate();
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [calculations, setCalculations] = useState<TireWearCalculation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const [selectedTire, setSelectedTire] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [treadDepth, setTreadDepth] = useState<number>(0);
  const [result, setResult] = useState<TireWearCalculation | null>(null);
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false);
  const [analysisType, setAnalysisType] = useState<'predict_wear' | 'cluster_analysis' | 'time_series_prediction'>('predict_wear');

  const mapDbTireToTire = (dbTire: TireFromDB): Tire => {
    return {
      id: dbTire.id,
      serialNumber: dbTire.serial_number,
      brand: dbTire.brand,
      model: dbTire.model,
      size: dbTire.size,
      type: dbTire.type as 'new' | 'retreaded',
      position: dbTire.position,
      vehicleId: dbTire.vehicle_id,
      purchaseDate: dbTire.purchase_date,
      purchasePrice: dbTire.purchase_price,
      supplier: dbTire.supplier,
      status: dbTire.status as 'active' | 'maintenance' | 'retreading' | 'expired' | 'sold',
      treadDepth: dbTire.tread_depth,
      mileage: dbTire.mileage,
      notes: dbTire.notes
    };
  };

  const mapDbVehicleToVehicle = (dbVehicle: VehicleFromDB): Vehicle => {
    return {
      id: dbVehicle.id,
      registrationNumber: dbVehicle.registration_number,
      brand: dbVehicle.brand,
      model: dbVehicle.model,
      type: dbVehicle.type,
      wheelPositions: dbVehicle.wheel_positions,
      currentMileage: dbVehicle.current_mileage,
      notes: dbVehicle.notes,
      tirePositions: []
    };
  };

  const mapDbCalculationToCalculation = (calc: TireWearCalculationFromDB): TireWearCalculation => {
    // Validate and ensure analysis_type is one of the allowed values
    let validAnalysisType: 'predict_wear' | 'cluster_analysis' | 'time_series_prediction' = 'predict_wear';
    
    if (calc.analysis_type === 'predict_wear' || 
        calc.analysis_type === 'cluster_analysis' || 
        calc.analysis_type === 'time_series_prediction') {
      validAnalysisType = calc.analysis_type;
    }
    
    return {
      id: calc.id,
      calculation_date: calc.calculation_date,
      current_mileage: calc.current_mileage,
      current_age_days: calc.current_age_days,
      tread_depth_mm: calc.tread_depth_mm,
      predicted_wear_percentage: calc.predicted_wear_percentage,
      tire_id: calc.tire_id,
      vehicle_id: calc.vehicle_id,
      created_at: calc.created_at,
      updated_at: calc.updated_at,
      analysis_method: calc.analysis_method,
      analysis_result: calc.analysis_result,
      recommendation: calc.recommendation,
      notes: calc.notes,
      analysis_type: validAnalysisType
    };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vehiclesData, tiresData, calculationsData] = await Promise.all([
        supabase.from('vehicles').select('*').order('registration_number', { ascending: true }),
        supabase.from('tires').select('*').order('serial_number', { ascending: true }),
        supabase.from('tire_wear_calculations')
          .select('*')
          .order('calculation_date', { ascending: false })
          .limit(10)
      ]);

      if (vehiclesData.error) throw vehiclesData.error;
      if (tiresData.error) throw tiresData.error;
      if (calculationsData.error) throw calculationsData.error;

      setVehicles(vehiclesData.data ? vehiclesData.data.map(mapDbVehicleToVehicle) : []);
      setTires(tiresData.data ? tiresData.data.map(mapDbTireToTire) : []);
      setCalculations(calculationsData.data ? calculationsData.data.map(mapDbCalculationToCalculation) : []);
    } catch (error: any) {
      console.error("Error loading data from Supabase:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      if (vehicle) {
        setCurrentMileage(vehicle.currentMileage);
      }
    }
  }, [selectedVehicle, vehicles]);

  useEffect(() => {
    if (selectedTire) {
      const tire = tires.find(t => t.id === selectedTire);
      if (tire) {
        setTreadDepth(tire.treadDepth);
      }
    }
  }, [selectedTire, tires]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    
    toast({
      title: "รีเฟรชข้อมูลสำเร็จ",
      description: "ข้อมูลได้รับการอัปเดตล่าสุดแล้ว",
      variant: "default"
    });
  };

  const handleCalculate = async () => {
    try {
      setIsSaving(true);
      
      const tire = tires.find(t => t.id === selectedTire);
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      
      if (!tire || !vehicle) {
        throw new Error("ไม่พบข้อมูลยางหรือยานพาหนะที่เลือก");
      }
      
      const analysisResult = calculateTireWear({
        tireId: selectedTire,
        vehicleId: selectedVehicle,
        currentMileage,
        treadDepth,
        purchaseDate: tire.purchaseDate,
        initialTreadDepth: tire.type === 'new' ? 10 : 8,
        analysisType
      });
      
      const calculationData = {
        tire_id: selectedTire,
        vehicle_id: selectedVehicle,
        current_mileage: currentMileage,
        current_age_days: analysisResult.currentAgeDays,
        tread_depth_mm: treadDepth,
        predicted_wear_percentage: analysisResult.predictedWearPercentage,
        analysis_method: analysisResult.analysisMethod,
        analysis_result: analysisResult.analysisResult,
        recommendation: analysisResult.recommendation,
        notes: "การวัดปกติ",
        analysis_type: analysisType
      };
      
      const { data: calculationRecord, error: calculationError } = await supabase
        .from('tire_wear_calculations')
        .insert(calculationData)
        .select()
        .single();
      
      if (calculationError) throw calculationError;
      
      const { error: tireUpdateError } = await supabase
        .from('tires')
        .update({ 
          tread_depth: treadDepth,
          mileage: tire.mileage + (currentMileage - vehicle.currentMileage),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTire);
      
      if (tireUpdateError) throw tireUpdateError;
      
      if (currentMileage !== vehicle.currentMileage) {
        const { error: vehicleUpdateError } = await supabase
          .from('vehicles')
          .update({ 
            current_mileage: currentMileage,
            updated_at: new Date().toISOString() 
          })
          .eq('id', selectedVehicle);
        
        if (vehicleUpdateError) throw vehicleUpdateError;
      }
      
      // Create a proper typed TireWearCalculation result
      const calculationResult: TireWearCalculation = {
        ...mapDbCalculationToCalculation(calculationRecord),
        predicted_lifespan: analysisResult.predictedLifespan,
        wear_formula: analysisResult.wearFormula,
        status_code: analysisResult.statusCode
      };
      
      setCalculations(prev => [calculationResult, ...prev.slice(0, 9)]);
      setResult(calculationResult);
      setShowResultDialog(true);
      
      // Update local tire data to reflect the changes
      setTires(prevTires => 
        prevTires.map(t => 
          t.id === selectedTire 
            ? { ...t, treadDepth, mileage: t.mileage + (currentMileage - vehicle.currentMileage) } 
            : t
        )
      );
      
      // Update local vehicle data to reflect the changes
      setVehicles(prevVehicles => 
        prevVehicles.map(v => 
          v.id === selectedVehicle 
            ? { ...v, currentMileage } 
            : v
        )
      );
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "ผลการคำนวณการสึกหรอของยางได้ถูกบันทึกแล้ว",
        variant: "default"
      });
    } catch (error: any) {
      console.error("Error in tire wear calculation:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถคำนวณการสึกหรอได้",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTireName = (id: string) => {
    const tire = tires.find(t => t.id === id);
    return tire ? `${tire.brand} ${tire.model} (${tire.serialNumber})` : id;
  };
  
  const getVehicleName = (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : id;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                className="mr-4 text-white" 
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-white">คำนวณเรียวทาม</h1>
            </div>
            <Button
              variant="outline"
              className="bg-white text-primary hover:bg-gray-100" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              รีเฟรชข้อมูล
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <TireWearCalculationForm
                tires={tires}
                vehicles={vehicles}
                selectedTire={selectedTire}
                selectedVehicle={selectedVehicle}
                currentMileage={currentMileage}
                treadDepth={treadDepth}
                isSaving={isSaving}
                onTireChange={setSelectedTire}
                onVehicleChange={setSelectedVehicle}
                onMileageChange={setCurrentMileage}
                onTreadDepthChange={setTreadDepth}
                onCalculate={handleCalculate}
                analysisType={analysisType}
                onAnalysisTypeChange={setAnalysisType}
              />
            </div>
            
            <div className="md:col-span-1">
              <TireWearHistoryPanel
                calculations={calculations}
                getTireName={getTireName}
              />
            </div>
          </div>
        )}
      </main>
      
      <TireWearResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        result={result}
        getTireName={getTireName}
        getVehicleName={getVehicleName}
      />
    </div>
  );
};

export default RealTimeCalculation;
