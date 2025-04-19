
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
              <div className={`text-lg font-bold ${
                calculationResult.status_code === 'critical' ? 'text-red-600' :
                calculationResult.status_code === 'warning' ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {calculationResult.status_code || 'normal'}
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
