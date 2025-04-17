
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { Tire, Vehicle } from "@/types/models";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const activeTires = tires.filter(tire => tire.status === 'active');
  
  const getAnalysisTypeDescription = (type: 'predict_wear' | 'cluster_analysis' | 'time_series_prediction') => {
    switch (type) {
      case 'predict_wear':
        return 'คำนวณด้วยสูตร y = 0.00432X โดยใช้ข้อมูลจริง';
      case 'cluster_analysis':
        return 'เปรียบเทียบกับกลุ่มยางที่มีลักษณะการใช้งานคล้ายกัน';
      case 'time_series_prediction':
        return 'วิเคราะห์แนวโน้มการสึกหรอตามระยะเวลา';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">วิเคราะห์การสึกหรอของยาง</CardTitle>
        <CardDescription>กรอกข้อมูลให้ครบถ้วนเพื่อคำนวณการสึกหรอด้วยสูตร y = 0.00432X</CardDescription>
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
                {activeTires.length > 0 ? (
                  activeTires.map(tire => (
                    <SelectItem key={tire.id} value={tire.id}>
                      {tire.brand} {tire.model} - {tire.serialNumber}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="no-tires">ไม่พบข้อมูลยาง</SelectItem>
                )}
              </SelectContent>
            </Select>
            {activeTires.length === 0 && (
              <p className="text-amber-600 text-xs mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                ไม่พบข้อมูลยางที่มีสถานะ "active" โปรดเพิ่มยางในเมนูข้อมูลหลัก
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกยานพาหนะ</label>
            <Select onValueChange={onVehicleChange} value={selectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกยานพาหนะ" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length > 0 ? (
                  vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.registrationNumber}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="no-vehicles">ไม่พบข้อมูลยานพาหนะ</SelectItem>
                )}
              </SelectContent>
            </Select>
            {vehicles.length === 0 && (
              <p className="text-amber-600 text-xs mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                ไม่พบข้อมูลยานพาหนะ โปรดเพิ่มยานพาหนะในเมนูข้อมูลหลัก
              </p>
            )}
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">ความลึกดอกยาง (มม.)</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-60">
                    <p>ความลึกดอกยางมาตรฐานอยู่ที่ประมาณ 8-10 มม. สำหรับยางใหม่ และต่ำสุดที่ยังปลอดภัยในการใช้งานคือ 1.6 มม.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input 
              type="number" 
              step="0.1"
              placeholder="กรอกความลึกดอกยาง" 
              value={treadDepth === 0 ? "" : treadDepth} 
              onChange={(e) => onTreadDepthChange(Number(e.target.value))}
            />
            {treadDepth < 1.6 && treadDepth > 0 && (
              <p className="text-red-600 text-xs mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                ความลึกดอกยางต่ำกว่าเกณฑ์ปลอดภัย (1.6 มม.)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วิธีคำนวณ</label>
            <Select onValueChange={onAnalysisTypeChange} value={analysisType}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกวิธีคำนวณ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="predict_wear">
                  <div className="flex flex-col">
                    <span>การทำนายการสึกหรอ</span>
                    <span className="text-xs text-gray-500">{getAnalysisTypeDescription('predict_wear')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="cluster_analysis">
                  <div className="flex flex-col">
                    <span>การวิเคราะห์กลุ่ม</span>
                    <span className="text-xs text-gray-500">{getAnalysisTypeDescription('cluster_analysis')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="time_series_prediction">
                  <div className="flex flex-col">
                    <span>การทำนายอนุกรมเวลา</span>
                    <span className="text-xs text-gray-500">{getAnalysisTypeDescription('time_series_prediction')}</span>
                  </div>
                </SelectItem>
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
