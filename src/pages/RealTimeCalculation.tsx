
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, Calculator, History } from "lucide-react";
import { TireWearExcelImporter } from "@/components/tire-wear/TireWearExcelImporter";
import TireWearAdvancedCalculation from "@/components/tire-wear/TireWearAdvancedCalculation";
import { useTireWearData } from "@/hooks/useTireWearData";
import { SimpleCalculatorForm } from "@/components/tire-wear/SimpleCalculatorForm";
import { TireWearHistoryPanel } from "@/components/tire-wear/TireWearHistoryPanel";
import { TireWearCalculatorDialog } from "@/components/tire-wear/TireWearCalculatorDialog";
import { TireWearCalculation } from "@/types/models";

const RealTimeCalculation = () => {
  const { tires, vehicles, calculationResults, isLoading, refreshData } = useTireWearData();
  const [activeTab, setActiveTab] = useState("advanced");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [currentResult, setCurrentResult] = useState<TireWearCalculation | null>(null);

  const handleCalculationComplete = (result: TireWearCalculation) => {
    setCurrentResult(result);
    setShowResultDialog(true);
    refreshData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">การคำนวณการสึกหรอแบบเรียลไทม์</h1>

      <div className="mb-6">
        <TireWearExcelImporter 
          tires={tires}
          vehicles={vehicles}
          onImportComplete={refreshData}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="advanced">
            <Calculator className="h-4 w-4 mr-2" />
            การคำนวณแบบละเอียด
          </TabsTrigger>
          <TabsTrigger value="simple">
            <Calculator className="h-4 w-4 mr-2" />
            การคำนวณพื้นฐาน
          </TabsTrigger>
        </TabsList>
        <TabsContent value="advanced" className="pt-4">
          <TireWearAdvancedCalculation />
        </TabsContent>
        <TabsContent value="simple" className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <SimpleCalculatorForm
              tires={tires}
              vehicles={vehicles}
              onCalculationComplete={handleCalculationComplete}
            />
          </div>
          <div className="md:col-span-2">
            <TireWearHistoryPanel
              calculations={calculationResults}
              tires={tires}
              vehicles={vehicles}
              onRefresh={refreshData}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <TireWearCalculatorDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        calculationResult={currentResult}
      />
    </div>
  );
};

export default RealTimeCalculation;
