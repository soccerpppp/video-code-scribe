
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TireWearCalculation } from "@/types/models";

interface TireWearCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculationResult: TireWearCalculation | null;
}

export function TireWearCalculatorDialog({
  open,
  onOpenChange,
  calculationResult
}: TireWearCalculatorDialogProps) {
  if (!calculationResult) return null;

  // Determine status class based on status_code or predicted_wear_percentage
  const getStatusClass = () => {
    if (calculationResult.status_code === 'critical') return 'text-red-600';
    if (calculationResult.status_code === 'warning') return 'text-yellow-600';
    if (calculationResult.predicted_wear_percentage >= 80) return 'text-red-600';
    if (calculationResult.predicted_wear_percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get status text
  const getStatusText = () => {
    if (calculationResult.status_code) return calculationResult.status_code;
    if (calculationResult.predicted_wear_percentage >= 80) return 'critical';
    if (calculationResult.predicted_wear_percentage >= 60) return 'warning';
    return 'normal';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ผลการวิเคราะห์การสึกหรอของยาง</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">สถานะปัจจุบัน</div>
              <div className={`text-lg font-bold ${getStatusClass()}`}>
                {getStatusText()}
              </div>
              <div className="mt-2 text-sm">
                ความลึกดอกยาง: {calculationResult.tread_depth_mm.toFixed(1)} มม.
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">ผลการวิเคราะห์</h3>
            <p>{calculationResult.analysis_result}</p>
            
            <div className="mt-4 p-4 border rounded-lg bg-muted">
              <div className="font-medium mb-2">คำแนะนำ</div>
              <p>{calculationResult.recommendation}</p>
            </div>
          </div>
          
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
