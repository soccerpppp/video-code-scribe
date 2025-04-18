
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TireWearCalculation, Tire, Vehicle } from "@/types/models";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface TireWearHistoryPanelProps {
  calculations: TireWearCalculation[];
  tires: Tire[];
  vehicles: Vehicle[];
  onRefresh: () => Promise<void>;
}

export function TireWearHistoryPanel({ calculations, tires, vehicles, onRefresh }: TireWearHistoryPanelProps) {
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

  const getStatusCodeFromResult = (result: string): 'normal' | 'warning' | 'critical' | 'error' => {
    if (result.includes('วิกฤต') || result.includes('ต่ำกว่าระดับปลอดภัย')) {
      return 'critical';
    } else if (result.includes('สูง')) {
      return 'warning';
    } else {
      return 'normal';
    }
  };

  const getTireName = (id: string): string => {
    const tire = tires.find(t => t.id === id);
    return tire ? `${tire.brand} ${tire.model} - ${tire.serialNumber}` : id;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ประวัติการคำนวณล่าสุด</CardTitle>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        {calculations && calculations.length > 0 ? (
          <div className="space-y-4">
            {calculations.map(calc => {
              // Use status_code if available, otherwise determine from analysis_result
              const statusCode = calc.status_code || getStatusCodeFromResult(calc.analysis_result);
              
              return (
                <div key={calc.id} className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(statusCode)}
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
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">ไม่มีประวัติการคำนวณ</p>
        )}
      </CardContent>
    </Card>
  );
}
