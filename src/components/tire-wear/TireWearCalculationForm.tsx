import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Tire, Vehicle } from "@/types/models";

interface TireWearCalculationFormProps {
  tires: Tire[];
  vehicles: Vehicle[];
  selectedTire: string;
  selectedVehicle: string;
  currentMileage: number;
  treadDepth: number;
  isSaving: boolean;
  onTireChange: (value: string) => void;
  onVehicleChange: (value: string) => void;
  onMileageChange: (value: number) => void;
  onTreadDepthChange: (value: number) => void;
  onCalculate: () => void;
  analysisType: 'predict_wear' | 'cluster_analysis' | 'time_series_prediction';
  onAnalysisTypeChange: (value: 'predict_wear' | 'cluster_analysis' | 'time_series_prediction') => void;
}

export function TireWearCalculationForm({
  tires,
  vehicles,
  selectedTire,
  selectedVehicle,
  currentMileage,
  treadDepth,
  isSaving,
  onTireChange,
  onVehicleChange,
  onMileageChange,
  onTreadDepthChange,
  onCalculate,
  analysisType,
  onAnalysisTypeChange
}: TireWearCalculationFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">วิเคราะห์การสึกหรอของยาง</CardTitle>
        <CardDescription>กรอกข้อมูลให้ครบถ้วนเพื่อคำนวณการสึกหรอ</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกยาง</label>
            <Select onValueChange={onTireChange} value={selectedTire}>
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
            <Select onValueChange={onVehicleChange} value={selectedVehicle}>
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
              onChange={(e) => onMileageChange(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ความลึกดอกยาง (มม.)</label>
            <Input 
              type="number" 
              step="0.1"
              placeholder="กรอกความลึกดอกยาง" 
              value={treadDepth === 0 ? "" : treadDepth} 
              onChange={(e) => onTreadDepthChange(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วิธีคำนวณ</label>
            <Select onValueChange={onAnalysisTypeChange} value={analysisType}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกวิธีคำนวณ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="predict_wear">การทำนายการสึกหรอ</SelectItem>
                <SelectItem value="cluster_analysis">การวิเคราะห์กลุ่ม</SelectItem>
                <SelectItem value="time_series_prediction">การทำนายอนุกรมเวลา</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={onCalculate} 
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
  );
}
