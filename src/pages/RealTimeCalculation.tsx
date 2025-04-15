
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { calculateTireWear } from "@/utils/tire-wear-calculator";
import { supabase } from "@/integrations/supabase/client";
import { Tire, Vehicle } from "@/types/models";
import { toast } from "sonner"; 
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RealTimeCalculation: React.FC = () => {
  const navigate = useNavigate();
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedTire, setSelectedTire] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [treadDepth, setTreadDepth] = useState<number>(0);

  // Use mock data since the tables don't exist yet
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock tire data
        const mockTires: Tire[] = [
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
        
        // Mock vehicle data
        const mockVehicles: Vehicle[] = [
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

        setTires(mockTires);
        setVehicles(mockVehicles);
        
      } catch (error) {
        console.error("Error setting up mock data:", error);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      }
    };
    
    fetchData();
  }, []);

  const handleCalculate = async () => {
    try {
      const analysisResult = calculateTireWear({
        tireId: selectedTire,
        vehicleId: selectedVehicle,
        currentMileage,
        treadDepth
      });

      // Save calculation to database
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

      if (error) throw error;

      // Show toast with result
      toast.info("การคำนวณเรียวทาม", {
        description: analysisResult.recommendation
      });
    } catch (error) {
      console.error("Error in tire wear calculation:", error);
      toast.error("เกิดข้อผิดพลาดในการคำนวณ");
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
        <Card>
          <CardHeader>
            <CardTitle>วิเคราะห์การสึกหรอของยาง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">เลือกยาง</label>
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
                <label className="block text-sm font-medium text-gray-700">เลือกยานพาหนะ</label>
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
                <label className="block text-sm font-medium text-gray-700">ระยะทางปัจจุบัน (กม.)</label>
                <Input 
                  type="number" 
                  placeholder="กรอกระยะทาง" 
                  value={currentMileage === 0 ? "" : currentMileage} 
                  onChange={(e) => setCurrentMileage(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ความลึกดอกยาง (มม.)</label>
                <Input 
                  type="number" 
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
      </main>
    </div>
  );
};

export default RealTimeCalculation;
