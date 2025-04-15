
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { calculateTireWear } from "@/utils/tire-wear-calculator";
import { supabase } from "@/integrations/supabase/client";
import { Tire, Vehicle } from "@/types/models";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LOCAL_STORAGE_KEYS = {
  TIRES: 'tire-tracker-tires',
  VEHICLES: 'tire-tracker-vehicles',
  CALCULATIONS: 'tire-tracker-calculations',
};

interface TireWearCalculation {
  id: string;
  calculationDate: string;
  tireId: string;
  vehicleId: string;
  currentMileage: number;
  currentAgeDays: number;
  treadDepth: number;
  predictedWearPercentage: number;
  predictedLifespan: number;
  analysisMethod: string;
  analysisResult: string;
  recommendation: string;
  wearFormula: string;
  statusCode: 'normal' | 'warning' | 'critical' | 'error';
}

const RealTimeCalculation: React.FC = () => {
  const navigate = useNavigate();
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [calculations, setCalculations] = useState<TireWearCalculation[]>([]);
  
  const [selectedTire, setSelectedTire] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [treadDepth, setTreadDepth] = useState<number>(0);
  const [result, setResult] = useState<TireWearCalculation | null>(null);
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false);
  
  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        // Load tires
        const savedTires = localStorage.getItem(LOCAL_STORAGE_KEYS.TIRES);
        if (savedTires) {
          setTires(JSON.parse(savedTires));
        } else {
          // Fallback to demo data if no saved data
          const demoTires: Tire[] = [
            {
              id: "t1",
              serialNumber: "TH12345678",
              brand: "Michelin",
              model: "Pilot Sport 4",
              size: "215/55R17",
              type: "new",
              purchaseDate: new Date().toISOString(),
              purchasePrice: 3500,
              supplier: "Michelin Thailand",
              status: "active",
              treadDepth: 7.5,
              mileage: 0
            },
            {
              id: "t2",
              serialNumber: "BG87654321",
              brand: "Bridgestone",
              model: "Turanza",
              size: "205/65R16",
              type: "new",
              purchaseDate: new Date().toISOString(),
              purchasePrice: 3200,
              supplier: "Bridgestone Thailand",
              status: "active",
              treadDepth: 8.0,
              mileage: 0
            }
          ];
          setTires(demoTires);
          localStorage.setItem(LOCAL_STORAGE_KEYS.TIRES, JSON.stringify(demoTires));
        }
        
        // Load vehicles
        const savedVehicles = localStorage.getItem(LOCAL_STORAGE_KEYS.VEHICLES);
        if (savedVehicles) {
          setVehicles(JSON.parse(savedVehicles));
        } else {
          // Fallback to demo data if no saved data
          const demoVehicles: Vehicle[] = [
            {
              id: "v1",
              registrationNumber: "กข 1234 กรุงเทพ",
              type: "รถกระบะ",
              brand: "Toyota",
              model: "Hilux Revo",
              wheelPositions: 4,
              currentMileage: 15000,
              tirePositions: [
                { position: "หน้าซ้าย", tireId: "t1" },
                { position: "หน้าขวา", tireId: "t2" }
              ]
            },
            {
              id: "v2",
              registrationNumber: "ฮต 5678 กรุงเทพ",
              type: "รถเก๋ง",
              brand: "Honda",
              model: "Civic",
              wheelPositions: 4,
              currentMileage: 25000,
              tirePositions: []
            }
          ];
          setVehicles(demoVehicles);
          localStorage.setItem(LOCAL_STORAGE_KEYS.VEHICLES, JSON.stringify(demoVehicles));
        }
        
        // Load previous calculations
        const savedCalculations = localStorage.getItem(LOCAL_STORAGE_KEYS.CALCULATIONS);
        if (savedCalculations) {
          setCalculations(JSON.parse(savedCalculations));
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลได้",
          variant: "destructive"
        });
      }
    };
    
    loadData();
  }, []);

  // Auto-fill current mileage when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      if (vehicle) {
        setCurrentMileage(vehicle.currentMileage);
      }
    }
  }, [selectedVehicle, vehicles]);

  // Auto-fill tread depth when tire is selected
  useEffect(() => {
    if (selectedTire) {
      const tire = tires.find(t => t.id === selectedTire);
      if (tire && tire.treadDepth) {
        setTreadDepth(tire.treadDepth);
      }
    }
  }, [selectedTire, tires]);

  const handleCalculate = async () => {
    try {
      const analysisResult = calculateTireWear({
        tireId: selectedTire,
        vehicleId: selectedVehicle,
        currentMileage,
        treadDepth
      });
      
      // Create calculation result
      const calculationResult: TireWearCalculation = {
        id: `calc-${Date.now()}`,
        calculationDate: new Date().toISOString(),
        tireId: selectedTire,
        vehicleId: selectedVehicle,
        currentMileage,
        currentAgeDays: analysisResult.currentAgeDays,
        treadDepth,
        predictedWearPercentage: analysisResult.predictedWearPercentage,
        predictedLifespan: analysisResult.predictedLifespan,
        analysisMethod: analysisResult.analysisMethod,
        analysisResult: analysisResult.analysisResult,
        recommendation: analysisResult.recommendation,
        wearFormula: analysisResult.wearFormula,
        statusCode: analysisResult.statusCode
      };
      
      // Save calculation to localStorage
      const updatedCalculations = [...calculations, calculationResult];
      localStorage.setItem(LOCAL_STORAGE_KEYS.CALCULATIONS, JSON.stringify(updatedCalculations));
      setCalculations(updatedCalculations);
      
      // Update tire treadDepth
      const updatedTires = tires.map(tire => {
        if (tire.id === selectedTire) {
          return { ...tire, treadDepth };
        }
        return tire;
      });
      localStorage.setItem(LOCAL_STORAGE_KEYS.TIRES, JSON.stringify(updatedTires));
      setTires(updatedTires);
      
      // Update vehicle mileage
      const updatedVehicles = vehicles.map(vehicle => {
        if (vehicle.id === selectedVehicle) {
          return { ...vehicle, currentMileage };
        }
        return vehicle;
      });
      localStorage.setItem(LOCAL_STORAGE_KEYS.VEHICLES, JSON.stringify(updatedVehicles));
      setVehicles(updatedVehicles);
      
      // Set result and show dialog
      setResult(calculationResult);
      setShowResultDialog(true);
      
      // Also try to save to Supabase if available
      try {
        const { error } = await supabase.from('tire_wear_calculations').insert({
          tire_id: selectedTire,
          vehicle_id: selectedVehicle,
          current_mileage: currentMileage,
          current_age_days: analysisResult.currentAgeDays,
          tread_depth_mm: treadDepth,
          predicted_wear_percentage: analysisResult.predictedWearPercentage,
          analysis_method: analysisResult.analysisMethod,
          analysis_result: analysisResult.analysisResult,
          recommendation: analysisResult.recommendation
        });

        if (error) {
          console.error("Error saving to Supabase:", error);
          // Continue execution - the data is already saved locally
        }
      } catch (supabaseError) {
        console.error("Supabase save failed:", supabaseError);
        // Continue execution - the data is already saved locally
      }
      
    } catch (error) {
      console.error("Error in tire wear calculation:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถคำนวณการสึกหรอได้",
        variant: "destructive"
      });
    }
  };

  // Get status icon based on the calculation result
  const getStatusIcon = (status: 'normal' | 'warning' | 'critical' | 'error') => {
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
                            {tire.brand} {tire.model} - {tire.serialNumber}
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
                            {vehicle.brand} {vehicle.model} - {vehicle.registrationNumber}
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
                    disabled={!selectedTire || !selectedVehicle || !currentMileage || !treadDepth}
                    className="w-full"
                  >
                    คำนวณการสึกหรอ
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
                    {calculations.slice(-5).reverse().map(calc => (
                      <div key={calc.id} className="border rounded-md p-3 bg-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(calc.statusCode)}
                          <span className="font-medium">
                            {new Date(calc.calculationDate).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          ยาง: {getTireName(calc.tireId)}
                        </p>
                        <p className="text-sm text-gray-600">
                          การสึกหรอ: {calc.predictedWearPercentage}%
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
      </main>
      
      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result && getStatusIcon(result.statusCode)}
              ผลการวิเคราะห์การสึกหรอ
            </DialogTitle>
            <DialogDescription>
              วันที่วิเคราะห์: {result && new Date(result.calculationDate).toLocaleDateString('th-TH')}
            </DialogDescription>
          </DialogHeader>
          
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">ยาง</p>
                  <p className="font-medium">{getTireName(result.tireId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ยานพาหนะ</p>
                  <p className="font-medium">{getVehicleName(result.vehicleId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ระยะทาง</p>
                  <p className="font-medium">{result.currentMileage.toLocaleString()} กม.</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ความลึกดอกยาง</p>
                  <p className="font-medium">{result.treadDepth} มม.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">สูตรคำนวณการสึกหรอ</p>
                <p className="font-mono text-sm">{result.wearFormula}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">ผลการวิเคราะห์</p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">การสึกหรอ</span>
                    <span className={`font-bold ${
                      result.predictedWearPercentage >= 75 ? 'text-red-500' : 
                      result.predictedWearPercentage >= 50 ? 'text-amber-500' : 
                      'text-green-500'
                    }`}>
                      {result.predictedWearPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        result.predictedWearPercentage >= 75 ? 'bg-red-500' : 
                        result.predictedWearPercentage >= 50 ? 'bg-amber-500' : 
                        'bg-green-500'
                      }`} 
                      style={{ width: `${result.predictedWearPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium mb-1">{result.analysisResult}</p>
                <p className="text-sm">{result.recommendation}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">ประมาณการระยะทางที่สามารถใช้งานได้อีก</p>
                <p className="font-medium">{result.predictedLifespan.toLocaleString()} กม.</p>
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
