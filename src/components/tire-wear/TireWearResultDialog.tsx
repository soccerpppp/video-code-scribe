
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TireWearCalculation } from "@/types/models";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface TireWearResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: TireWearCalculation | null;
  getTireName: (id: string) => string;
  getVehicleName: (id: string) => string;
}

export function TireWearResultDialog({
  open,
  onOpenChange,
  result,
  getTireName,
  getVehicleName
}: TireWearResultDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            
            <Button onClick={() => onOpenChange(false)} className="w-full">
              ปิด
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
