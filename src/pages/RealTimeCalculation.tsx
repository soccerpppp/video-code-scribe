
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Calculator, History, FileSpreadsheet } from "lucide-react";
import { TireWearCalculationForm } from "@/components/tire-wear/TireWearCalculationForm";
import { TireWearHistoryPanel } from "@/components/tire-wear/TireWearHistoryPanel";
import { TireWearResultDialog } from "@/components/tire-wear/TireWearResultDialog";
import TireWearAdvancedCalculation from "@/components/tire-wear/TireWearAdvancedCalculation";
import { TireWearExcelImporter } from "@/components/tire-wear/TireWearExcelImporter";
import { Tire, Vehicle, TireWearCalculation, TireWearAnalysisTypeUnified } from "@/types/models";
import { calculateTireWear } from "@/utils/tire-wear-calculator";
import { supabase } from "@/integrations/supabase/client";

const RealTimeCalculation = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("advanced");
  const [calculationResults, setCalculationResults] = useState<TireWearCalculation[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  // Simple calculation state
  const [selectedTire, setSelectedTire] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [currentMileage, setCurrentMileage] = useState(0);
  const [treadDepth, setTreadDepth] = useState(0);
  const [analysisType, setAnalysisType] = useState<TireWearAnalysisTypeUnified>('standard_prediction');
  const [currentResult, setCurrentResult] = useState<TireWearCalculation | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tires data
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('*')
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;

      // Fetch vehicles data
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;

      // Fetch calculation history
      const { data: historyData, error: historyError } = await supabase
        .from('tire_wear_calculations')
        .select('*')
        .order('calculation_date', { ascending: false });
      
      if (historyError) throw historyError;
      
      // Transform data for component consumption
      const formattedTires: Tire[] = tiresData?.map(tire => ({
        id: tire.id,
        serialNumber: tire.serial_number,
        brand: tire.brand,
        model: tire.model,
        size: tire.size,
        type: tire.type as 'new' | 'retreaded',
        position: tire.position,
        vehicleId: tire.vehicle_id,
        purchaseDate: tire.purchase_date,
        purchasePrice: tire.purchase_price,
        supplier: tire.supplier,
        status: tire.status as 'active' | 'maintenance' | 'retreading' | 'expired' | 'sold',
        treadDepth: tire.tread_depth,
        mileage: tire.mileage,
        notes: tire.notes
      })) || [];
      
      const formattedVehicles: Vehicle[] = vehiclesData?.map(vehicle => ({
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        brand: vehicle.brand,
        model: vehicle.model,
        type: vehicle.type,
        wheelPositions: vehicle.wheel_positions,
        currentMileage: vehicle.current_mileage,
        notes: vehicle.notes,
        tirePositions: [] // We'll need to fetch this separately if needed
      })) || [];

      // Transform the calculation history data with proper type handling
      const formattedCalculations: TireWearCalculation[] = historyData?.map(calc => {
        // Cast the analysis_type to our unified type to resolve the TypeScript error
        const analysisType = calc.analysis_type as TireWearAnalysisTypeUnified;
        
        return {
          id: calc.id,
          calculation_date: calc.calculation_date,
          current_mileage: calc.current_mileage,
          current_age_days: calc.current_age_days,
          tread_depth_mm: calc.tread_depth_mm,
          predicted_wear_percentage: calc.predicted_wear_percentage,
          predicted_lifespan: calc.predicted_lifespan || undefined,
          wear_formula: calc.wear_formula || undefined,
          status_code: calc.status_code as 'normal' | 'warning' | 'critical' | 'error' | undefined,
          tire_id: calc.tire_id,
          vehicle_id: calc.vehicle_id,
          analysis_method: calc.analysis_method,
          analysis_result: calc.analysis_result,
          recommendation: calc.recommendation,
          notes: calc.notes || undefined,
          created_at: calc.created_at,
          updated_at: calc.updated_at,
          analysis_type: analysisType
        };
      }) || [];
      
      setTires(formattedTires);
      setVehicles(formattedVehicles);
      setCalculationResults(formattedCalculations);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      // Get tire details
      const tire = tires.find(t => t.id === selectedTire);
      if (!tire) {
        throw new Error("ไม่พบข้อมูลยาง");
      }
      
      // Map the analysis type to make sure it's compatible with the calculator
      const mappedAnalysisType = mapAnalysisTypeForCalculator(analysisType);
      
      // Calculate tire wear
      const result = calculateTireWear({
        tireId: selectedTire,
        vehicleId: selectedVehicle,
        currentMileage,
        treadDepth,
        purchaseDate: tire.purchaseDate,
        initialTreadDepth: tire.type === 'new' ? 15 : undefined, // Example default for new tire
        analysisType: mappedAnalysisType
      });

      // Create a TireWearCalculation object from the analysis result
      const calculationResult: TireWearCalculation = {
        id: '', // Will be set by the database
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
        recommendation: result.recommendation
      };

      // Save calculation to database
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
          recommendation: result.recommendation
        })
        .select();
      
      if (error) throw error;
      
      // If the insert was successful and we got back the inserted record
      if (data && data.length > 0) {
        // Update the currentResult with the database record
        const insertedRecord = data[0];
        calculationResult.id = insertedRecord.id;
        
        setCurrentResult(calculationResult);
        setShowResultDialog(true);
        
        // Refresh calculation history
        fetchData();
      }
      
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
  
  // Helper function to map analysis types to those that calculator supports
  const mapAnalysisTypeForCalculator = (type: TireWearAnalysisTypeUnified): 'standard_prediction' | 'statistical_regression' | 'position_based' | 'predict_wear' | 'cluster_analysis' | 'time_series_prediction' => {
    // Since we've updated the tire-wear-calculator.ts to accept all types, we can just return the type
    return type;
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
          onImportComplete={fetchData}
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
            <TireWearCalculationForm
              tires={tires}
              vehicles={vehicles}
              selectedTire={selectedTire}
              selectedVehicle={selectedVehicle}
              currentMileage={currentMileage}
              treadDepth={treadDepth}
              isSaving={isSaving}
              onTireChange={setSelectedTire}
              onVehicleChange={setSelectedVehicle}
              onMileageChange={setCurrentMileage}
              onTreadDepthChange={setTreadDepth}
              onCalculate={handleCalculate}
              analysisType={analysisType}
              onAnalysisTypeChange={setAnalysisType}
            />
          </div>
          <div className="md:col-span-2">
            <TireWearHistoryPanel
              calculations={calculationResults}
              tires={tires}
              vehicles={vehicles}
              onRefresh={fetchData}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Results Dialog */}
      <TireWearResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        result={currentResult}
        tire={tires.find(t => t.id === selectedTire)}
        vehicle={vehicles.find(v => v.id === selectedVehicle)}
      />
    </div>
  );
};

export default RealTimeCalculation;
