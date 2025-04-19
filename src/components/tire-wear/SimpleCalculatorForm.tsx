
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tire, Vehicle, TireWearCalculation, TireWearAnalysisTypeUnified } from "@/types/models";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateTireWear } from "@/utils/tire-wear-calculator";

interface SimpleCalculatorFormProps {
  tires: Tire[];
  vehicles: Vehicle[];
  onCalculationComplete: (result: TireWearCalculation) => void;
}

export function SimpleCalculatorForm({
  tires,
  vehicles,
  onCalculationComplete
}: SimpleCalculatorFormProps) {
  const [selectedTire, setSelectedTire] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [currentMileage, setCurrentMileage] = useState(0);
  const [treadDepth, setTreadDepth] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisType, setAnalysisType] = useState<TireWearAnalysisTypeUnified>('standard_prediction');

  const handleCalculate = async () => {
    if (!selectedTire || !selectedVehicle || currentMileage <= 0 || treadDepth <= 0) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const tire = tires.find(t => t.id === selectedTire);
      if (!tire) {
        throw new Error("ไม่พบข้อมูลยาง");
      }

      const result = calculateTireWear({
        tireId: selectedTire,
        vehicleId: selectedVehicle,
        currentMileage,
        treadDepth,
        purchaseDate: tire.purchaseDate,
        initialTreadDepth: tire.type === 'new' ? 15 : undefined,
        analysisType
      });

      const { data, error } = await supabase
        .from('tire_wear_calculations')
        .insert({
          tire_id: selectedTire,
          vehicle_id: selectedVehicle,
          calculation_date: new Date().toISOString(),
          current_mileage: currentMileage,
          current_age_days: result.currentAgeDays,
          tread_depth_mm: treadDepth,
          predicted_wear_percentage: result.predictedWearPercentage,
          predicted_lifespan: result.predictedLifespan,
          wear_formula: result.wearFormula,
          status_code: result.statusCode,
          analysis_type: analysisType,
          analysis_method: result.analysisMethod,
          analysis_result: result.analysisResult,
          recommendation: result.recommendation,
          notes: `วิธีวิเคราะห์: ${result.analysisMethod}, ความเชื่อมั่น: ${result.confidenceLevel}`
        })
        .select()
        .single();

      if (error) throw error;

      onCalculationComplete(data as TireWearCalculation);
      
      toast({
        title: "คำนวณสำเร็จ",
        description: "บันทึกผลการวิเคราะห์การสึกหรอเรียบร้อยแล้ว",
      });
    } catch (error: any) {
      console.error("Error calculating tire wear:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถคำนวณการสึกหรอได้",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>การคำนวณพื้นฐาน</CardTitle>
        <CardDescription>กรอกข้อมูลเพื่อคำนวณการสึกหรอ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>เลือกยาง</Label>
          <Select onValueChange={setSelectedTire} value={selectedTire}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกยาง" />
            </SelectTrigger>
            <SelectContent>
              {tires.filter(tire => tire.status === 'active').map(tire => (
                <SelectItem key={tire.id} value={tire.id}>
                  {tire.brand} {tire.model} - {tire.serialNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>เลือกยานพาหนะ</Label>
          <Select onValueChange={setSelectedVehicle} value={selectedVehicle}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกยานพาหนะ" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNumber} - {vehicle.brand} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>ระยะทางปัจจุบัน (กม.)</Label>
          <Input
            type="number"
            value={currentMileage || ""}
            onChange={(e) => setCurrentMileage(Number(e.target.value))}
            placeholder="กรอกระยะทาง"
          />
        </div>

        <div>
          <Label>ความลึกดอกยาง (มม.)</Label>
          <Input
            type="number"
            step="0.1"
            value={treadDepth || ""}
            onChange={(e) => setTreadDepth(Number(e.target.value))}
            placeholder="กรอกความลึกดอกยาง"
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
              กำลังคำนวณ...
            </>
          ) : (
            'คำนวณการสึกหรอ'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
