
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { calculateTireWear } from "@/utils/tire-wear-calculator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Info, AlertTriangle, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Tire {
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
  notes: string | null;
}

interface Vehicle {
  id: string;
  registration_number: string;
  type: string;
  brand: string;
  model: string;
  wheel_positions: number;
  current_mileage: number;
  notes: string | null;
}

interface TirePosition {
  id: string;
  vehicle_id: string;
  tire_id: string | null;
  position: string;
}

interface TireWearCalculation {
  id: string;
  calculation_date: string;
  tire_id: string;
  vehicle_id: string;
  current_mileage: number;
  current_age_days: number;
  tread_depth_mm: number;
  predicted_wear_percentage: number;
  predicted_lifespan?: number;
  analysis_method: string;
  analysis_result: string;
  recommendation: string;
  wear_formula?: string;
  notes?: string;
  status_code?: 'normal' | 'warning' | 'critical' | 'error';
}

const RealTimeCalculation: React.FC = () => {
  const navigate = useNavigate();
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tirePositions, setTirePositions] = useState<TirePosition[]>([]);
  const [calculations, setCalculations] = useState<TireWearCalculation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const [selectedTire, setSelectedTire] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [treadDepth, setTreadDepth] = useState<number>(0);
  const [result, setResult] = useState<TireWearCalculation | null>(null);
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false);
  
  // Load data from Supabase on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .order('registration_number', { ascending: true });
        
        if (vehiclesError) throw vehiclesError;
        setVehicles(vehiclesData || []);
        
        // Load tires
        const { data: tiresData, error: tiresError } = await supabase
          .from('tires')
          .select('*')
          .order('serial_number', { ascending: true });
        
        if (tiresError) throw tiresError;
        setTires(tiresData || []);
        
        // Load tire positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('tire_positions')
          .select('*');
        
        if (positionsError) throw positionsError;
        setTirePositions(positionsData || []);
        
        // Load previous calculations
        const { data: calculationsData, error: calculationsError } = await supabase
          .from('tire_wear_calculations')
          .select('*')
          .order('calculation_date', { ascending: false })
          .limit(10);
        
        if (calculationsError) throw calculationsError;
        setCalculations(calculationsData || []);
      } catch (error) {
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

  // Auto-fill current mileage when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      if (vehicle) {
        setCurrentMileage(vehicle.current_mileage);
      }
    }
  }, [selectedVehicle, vehicles]);

  // Auto-fill tread depth when tire is selected
  useEffect(() => {
    if (selectedTire) {
      const tire = tires.find(t => t.id === selectedTire);
      if (tire) {
        setTreadDepth(tire.tread_depth);
      }
    }
  }, [selectedTire, tires]);

  const handleCalculate = async () => {
    try {
      setIsSaving(true);
      
      // Get selected tire and vehicle data
      const tire = tires.find(t => t.id === selectedTire);
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      
      if (!tire || !vehicle) {
        throw new Error("ไม่พบข้อมูลยางหรือยานพาหนะที่เลือก");
      }
      
      // Calculate tire wear with our utility
      const analysisResult = calculateTireWear({
        tireId: selectedTire,
        vehicleId: selectedVehicle,
        currentMileage,
        treadDepth,
        purchaseDate: tire.purchase_date,
        initialTreadDepth: tire.type === 'new' ? 10 : 8 // Assuming retreaded tires start at 8mm
      });
      
      // Prepare data for saving
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
      
      // Save calculation to Supabase
      const { data: calculationRecord, error: calculationError } = await supabase
        .from('tire_wear_calculations')
        .insert(calculationData)
        .select()
        .single();
      
      if (calculationError) throw calculationError;
      
      // Update tire tread depth
      const { error: tireUpdateError } = await supabase
        .from('tires')
        .update({ 
          tread_depth: treadDepth,
          mileage: tire.mileage + (currentMileage - vehicle.current_mileage), // Add additional mileage
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTire);
      
      if (tireUpdateError) throw tireUpdateError;
      
      // Update vehicle mileage if it changed
      if (currentMileage !== vehicle.current_mileage) {
        const { error: vehicleUpdateError } = await supabase
          .from('vehicles')
          .update({ 
            current_mileage: currentMileage,
            updated_at: new Date().toISOString() 
          })
          .eq('id', selectedVehicle);
        
        if (vehicleUpdateError) throw vehicleUpdateError;
      }
      
      // Update local state with new calculation
      const calculationResult: TireWearCalculation = {
        ...calculationRecord,
        predicted_lifespan: analysisResult.predictedLifespan,
        wear_formula: analysisResult.wearFormula,
        status_code: analysisResult.statusCode
      };
      
      setCalculations(prev => [calculationResult, ...prev.slice(0, 9)]);
      
      // Update local state for vehicles and tires
      setVehicles(prev => prev.map(v => {
        if (v.id === selectedVehicle) {
          return { ...v, current_mileage: currentMileage };
        }
        return v;
      }));
      
      setTires(prev => prev.map(t => {
        if (t.id === selectedTire) {
          return { 
            ...t, 
            tread_depth: treadDepth,
            mileage: t.mileage + (currentMileage - vehicle.current_mileage)
          };
        }
        return t;
      }));
      
      // Set result and show dialog
      setResult({
        ...calculationResult,
        predicted_lifespan: analysisResult.predictedLifespan,
        wear_formula: analysisResult.wearFormula,
        status_code: analysisResult.statusCode
      });
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

  // Get status icon based on the calculation result
  const getStatusIcon = (status?: 'normal' | 'warning' | 'critical' | 'error') => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-8 w-8 text-amber-500" />;
      case 'critical':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      case 'error':
        return <Info className="h-8 w-8 text-blue-500" />;
      default:
        return <Info className="h-8 w-8" />;
    }
  };
  
  // Helper to find tire or vehicle details by ID
  const getTireName = (id: string) => {
    const tire = tires.find(t => t.id === id);
    return tire ? `${tire.brand} ${tire.model} (${tire.serial_number})` : id;
  };
  
  const getVehicleName = (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})` : id;
  };

  // Get status code from analysis result
  const getStatusCodeFromResult = (result: string): 'normal' | 'warning' | 'critical' | 'error' => {
    if (result.includes('วิกฤต') || result.includes('ต่ำกว่าระดับปลอดภัย')) {
      return 'critical';
    } else if (result.includes('สูง')) {
      return 'warning';
    } else {
      return 'normal';
    }
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">วิเคราะห์การสึกหรอของยาง</CardTitle>
                  <CardDescription>กรอกข้อมูลให้ครบถ้วนเพื่อคำนวณการสึกหรอ</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เลือกยาง</label>
                      <Select onValueChange={setSelectedTire} value={selectedTire}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกยาง" />
                        </SelectTrigger>
                        <SelectContent>
                          {tires.map(tire => (
                            <SelectItem key={tire.id} value={tire.id}>
                              {tire.brand} {tire.model} - {tire.serial_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เลือกยานพาหนะ</label>
                      <Select onValueChange={setSelectedVehicle} value={selectedVehicle}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกยานพาหนะ" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.brand} {vehicle.model} - {vehicle.registration_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ระยะทางปัจจุบัน (กม.)</label>
                      <Input 
                        type="number" 
                        placeholder="กรอกระยะทาง" 
                        value={currentMileage === 0 ? "" : currentMileage} 
                        onChange={(e) => setCurrentMileage(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความลึกดอกยาง (มม.)</label>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="กรอกความลึกดอกยาง" 
                        value={treadDepth === 0 ? "" : treadDepth} 
                        onChange={(e) => setTreadDepth(Number(e.target.value))}
                      />
                    </div>

                    <Button 
                      onClick={handleCalculate} 
                      disabled={!selectedTire || !selectedVehicle || !currentMileage || !treadDepth || isSaving}
                      className="w-full"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        'คำนวณการสึกหรอ'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ประวัติการคำนวณล่าสุด</CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                  {calculations.length > 0 ? (
                    <div className="space-y-4">
                      {calculations.map(calc => (
                        <div key={calc.id} className="border rounded-md p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(calc.status_code || getStatusCodeFromResult(calc.analysis_result))}
                            <span className="font-medium">
                              {new Date(calc.calculation_date).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            ยาง: {getTireName(calc.tire_id)}
                          </p>
                          <p className="text-sm text-gray-600">
                            การสึกหรอ: {calc.predicted_wear_percentage}%
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">ไม่มีประวัติการคำนวณ</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result && getStatusIcon(result.status_code)}
              ผลการวิเคราะห์การสึกหรอ
            </DialogTitle>
            <DialogDescription>
              วันที่วิเคราะห์: {result && new Date(result.calculation_date).toLocaleDateString('th-TH')}
            </DialogDescription>
          </DialogHeader>
          
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">ยาง</p>
                  <p className="font-medium">{getTireName(result.tire_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ยานพาหนะ</p>
                  <p className="font-medium">{getVehicleName(result.vehicle_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ระยะทาง</p>
                  <p className="font-medium">{result.current_mileage.toLocaleString()} กม.</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ความลึกดอกยาง</p>
                  <p className="font-medium">{result.tread_depth_mm} มม.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">สูตรคำนวณการสึกหรอ</p>
                <p className="font-mono text-sm">{result.wear_formula}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">ผลการวิเคราะห์</p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">การสึกหรอ</span>
                    <span className={`font-bold ${
                      result.predicted_wear_percentage >= 75 ? 'text-red-500' : 
                      result.predicted_wear_percentage >= 50 ? 'text-amber-500' : 
                      'text-green-500'
                    }`}>
                      {result.predicted_wear_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        result.predicted_wear_percentage >= 75 ? 'bg-red-500' : 
                        result.predicted_wear_percentage >= 50 ? 'bg-amber-500' : 
                        'bg-green-500'
                      }`} 
                      style={{ width: `${result.predicted_wear_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium mb-1">{result.analysis_result}</p>
                <p className="text-sm">{result.recommendation}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">ประมาณการระยะทางที่สามารถใช้งานได้อีก</p>
                <p className="font-medium">{result.predicted_lifespan?.toLocaleString()} กม.</p>
              </div>
              
              <Button onClick={() => setShowResultDialog(false)} className="w-full">
                ปิด
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RealTimeCalculation;
