import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
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

const RealTimeCalculation: React.FC = () => {
  const navigate = useNavigate();
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [calculations, setCalculations] = useState<TireWearCalculation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const [selectedTire, setSelectedTire] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [treadDepth, setTreadDepth] = useState<number>(0);
  const [result, setResult] = useState<TireWearCalculation | null>(null);
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false);

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

  useEffect(() => {
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
        setCalculations(calculationsData.data || []);
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
        initialTreadDepth: tire.type === 'new' ? 10 : 8
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
        notes: "การวัดปกติ"
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
      
      const calculationResult = {
        ...calculationRecord,
        predicted_lifespan: analysisResult.predictedLifespan,
        wear_formula: analysisResult.wearFormula,
        status_code: analysisResult.statusCode
      } as TireWearCalculation;
      
      setCalculations(prev => [calculationResult, ...prev.slice(0, 9)]);
      setResult(calculationResult);
      setShowResultDialog(true);
      
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
