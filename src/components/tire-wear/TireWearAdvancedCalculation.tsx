
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tire, Vehicle, ActivityLog } from "@/types/models";
import { calculateTireWear } from "@/utils/tire-wear-calculator";
import { TireWearCalculationForm } from "@/components/tire-wear/TireWearCalculationForm";
import { TireWearHistoryPanel } from "@/components/tire-wear/TireWearHistoryPanel";
import { TireWearResultDialog } from "@/components/tire-wear/TireWearResultDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CalendarIcon, TrendingUp, BarChart3, DatabaseZap } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface MeasurementItem {
  date: string;
  depth: number;
  mileage?: number;
}

const TireWearAdvancedCalculation = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [measurements, setMeasurements] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedTire, setSelectedTire] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [treadDepth, setTreadDepth] = useState<number>(0);
  const [avgDailyDistance, setAvgDailyDistance] = useState<number>(150);
  const [analysisType, setAnalysisType] = useState<'standard_prediction' | 'statistical_regression' | 'position_based'>('standard_prediction');
  
  const [resultsVisible, setResultsVisible] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [measurementHistory, setMeasurementHistory] = useState<MeasurementItem[]>([]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date()
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (selectedTire && selectedVehicle) {
      fetchMeasurementHistory();
    }
  }, [selectedTire, selectedVehicle, dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // ดึงข้อมูลยาง
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('*')
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;
      
      // ดึงข้อมูลยานพาหนะ
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;
      
      // แปลงข้อมูลเป็นรูปแบบที่กำหนดไว้ใน types/models.ts
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
        tirePositions: [] // ข้อมูลนี้จะต้องดึงเพิ่มถ้าต้องการใช้
      })) || [];
      
      setTires(formattedTires);
      setVehicles(formattedVehicles);

    } catch (error: any) {
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

  const fetchMeasurementHistory = async () => {
    if (!selectedTire || !selectedVehicle) return;
    
    try {
      const fromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
      const toDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'measure')
        .eq('tire_id', selectedTire)
        .order('date', { ascending: true });
      
      if (fromDate) {
        query = query.gte('date', fromDate);
      }
      
      if (toDate) {
        query = query.lte('date', toDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // แปลงข้อมูลให้เข้ากับฟอร์แมต MeasurementItem
        const history: MeasurementItem[] = data.map(item => ({
          date: item.date,
          depth: item.measurement_value || 0,
          mileage: item.mileage || undefined
        }));
        
        setMeasurementHistory(history);
        
        // อัพเดตความลึกดอกยางปัจจุบันจากการวัดล่าสุด
        const latestMeasurement = data[data.length - 1];
        if (latestMeasurement && latestMeasurement.measurement_value) {
          setTreadDepth(latestMeasurement.measurement_value);
        }
        
        // อัพเดตระยะทางปัจจุบันจากยานพาหนะ
        const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
        if (selectedVehicleData && selectedVehicleData.currentMileage) {
          setCurrentMileage(selectedVehicleData.currentMileage);
        }
      } else {
        setMeasurementHistory([]);
        
        // ถ้าไม่มีประวัติการวัด ให้ใช้ค่าเริ่มต้นจากข้อมูลยางและยานพาหนะ
        const tireData = tires.find(t => t.id === selectedTire);
        if (tireData) {
          setTreadDepth(tireData.treadDepth);
        }
        
        const vehicleData = vehicles.find(v => v.id === selectedVehicle);
        if (vehicleData) {
          setCurrentMileage(vehicleData.currentMileage);
        }
      }
      
    } catch (error: any) {
      console.error("Error fetching measurement history:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงประวัติการวัดได้",
        variant: "destructive"
      });
    }
  };

  const handleCalculate = async () => {
    if (!selectedTire || !selectedVehicle || !currentMileage || !treadDepth) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // ดึงข้อมูลยางที่เลือก
      const selectedTireData = tires.find(t => t.id === selectedTire);
      if (!selectedTireData) {
        throw new Error("ไม่พบข้อมูลยาง");
      }
      
      // คำนวณการสึกหรอโดยใช้ฟังก์ชันที่อัพเดตแล้ว
      const calculationParams = {
        tireId: selectedTire,
        vehicleId: selectedVehicle,
        currentMileage,
        treadDepth,
        purchaseDate: selectedTireData.purchaseDate,
        initialTreadDepth: selectedTireData.type === 'new' ? 15 : undefined, // ค่าเริ่มต้นสำหรับยางใหม่
        position: selectedTireData.position,
        measurementHistory: measurementHistory.length > 0 ? measurementHistory : undefined,
        avgDailyDistance: avgDailyDistance,
        analysisType
      };
      
      const result = calculateTireWear(calculationParams);
      
      // บันทึกผลการคำนวณลงฐานข้อมูล
      const { error } = await supabase
        .from('tire_wear_calculations')
        .insert({
          tire_id: selectedTire,
          vehicle_id: selectedVehicle,
          calculation_date: new Date().toISOString(),
          current_mileage: currentMileage,
          current_age_days: result.currentAgeDays,
          tread_depth_mm: treadDepth,
          predicted_wear_percentage: result.wearRatePerDay * result.currentAgeDays * 100,
          analysis_type: analysisType,
          analysis_method: result.analysisMethod,
          analysis_result: result.analysisResult,
          recommendation: result.recommendation,
          notes: `วิธีวิเคราะห์: ${result.analysisMethod}, ความเชื่อมั่น: ${result.confidenceLevel}`
        });
      
      if (error) throw error;
      
      // แสดงผลการคำนวณ
      setCalculationResult(result);
      setResultsVisible(true);
      
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

  const renderMeasurementHistory = () => {
    if (measurementHistory.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          ไม่พบข้อมูลประวัติการวัดสำหรับยางที่เลือก
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>วันที่</TableHead>
            <TableHead>ความลึกดอกยาง (มม.)</TableHead>
            <TableHead>ระยะทาง (กม.)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {measurementHistory.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
              <TableCell>{item.depth.toFixed(1)}</TableCell>
              <TableCell>{item.mileage?.toLocaleString() || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        {/* ฟอร์มคำนวณ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">วิเคราะห์การสึกหรอขั้นสูง</CardTitle>
            <CardDescription>กรอกข้อมูลให้ครบถ้วนเพื่อคำนวณการสึกหรอของยาง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-1">เลือกยาง</Label>
                <Select onValueChange={setSelectedTire} value={selectedTire}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกยาง" />
                  </SelectTrigger>
                  <SelectContent>
                    {tires
                      .filter(tire => tire.status === 'active')
                      .map(tire => (
                        <SelectItem key={tire.id} value={tire.id}>
                          {tire.brand} {tire.model} - {tire.serialNumber} ({tire.position || 'ไม่ระบุตำแหน่ง'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-1">เลือกยานพาหนะ</Label>
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
                <Label className="block text-sm font-medium mb-1">ระยะทางปัจจุบัน (กม.)</Label>
                <Input 
                  type="number" 
                  placeholder="กรอกระยะทาง" 
                  value={currentMileage || ""} 
                  onChange={(e) => setCurrentMileage(Number(e.target.value))}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-1">ความลึกดอกยาง (มม.)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="กรอกความลึกดอกยาง" 
                  value={treadDepth || ""} 
                  onChange={(e) => setTreadDepth(Number(e.target.value))}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-1">ระยะทางเฉลี่ยต่อวัน (กม.)</Label>
                <Input 
                  type="number" 
                  placeholder="เช่น 150 กม./วัน" 
                  value={avgDailyDistance || ""} 
                  onChange={(e) => setAvgDailyDistance(Number(e.target.value))}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium mb-1">วิธีวิเคราะห์</Label>
                <Select 
                  onValueChange={(value) => setAnalysisType(value as any)} 
                  value={analysisType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกวิธีวิเคราะห์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard_prediction">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>การวิเคราะห์แบบมาตรฐาน</span>
                          <span className="text-xs text-gray-500">คำนวณจากข้อมูลการวัดปัจจุบัน</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="statistical_regression">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>การวิเคราะห์ทางสถิติ</span>
                          <span className="text-xs text-gray-500">ใช้การถดถอยเชิงเส้นจากประวัติการวัด</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="position_based">
                      <div className="flex items-center gap-2">
                        <DatabaseZap className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>วิเคราะห์ตามตำแหน่งติดตั้ง</span>
                          <span className="text-xs text-gray-500">ปรับค่าตามตำแหน่งติดตั้งยาง</span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        {/* แสดงประวัติการวัด */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-xl">ประวัติการวัด</CardTitle>
              <CardDescription>ข้อมูลการวัดความลึกดอกยางในช่วงเวลาที่เลือก</CardDescription>
            </div>
            
            {/* ตัวเลือกช่วงวันที่ */}
            <div className="flex items-center space-x-2">
              <DatePickerWithRange 
                date={dateRange} 
                setDate={setDateRange}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              renderMeasurementHistory()
            )}
          </CardContent>
        </Card>

        {/* แสดงผลการคำนวณ */}
        {calculationResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">ผลการวิเคราะห์การสึกหรอ</CardTitle>
              <CardDescription>
                วิธีวิเคราะห์: {calculationResult.analysisMethod}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">สถานะปัจจุบัน</div>
                    <div className={`text-lg font-bold ${
                      calculationResult.statusCode === 'critical' ? 'text-red-600' :
                      calculationResult.statusCode === 'warning' ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {calculationResult.status}
                    </div>
                    <div className="mt-2 text-sm">
                      ความลึกดอกยาง: {calculationResult.currentDepth.toFixed(1)} มม.
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">อัตราการสึกหรอ</div>
                    <div className="text-lg font-bold">
                      {calculationResult.wearRatePerDay.toFixed(4)} มม./วัน
                    </div>
                    <div className="mt-2 text-sm">
                      {calculationResult.wearRatePer1000Km.toFixed(2)} มม./1000กม.
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">การคาดการณ์</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium mb-2">ถึงเกณฑ์ความปลอดภัย (3.0 มม.)</div>
                      <div className="text-lg font-medium">
                        {calculationResult.daysToSafety === 9999 ? 
                          'ไม่สามารถคำนวณได้' : 
                          `อีกประมาณ ${calculationResult.daysToSafety} วัน`
                        }
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {calculationResult.daysToSafety === 9999 ? 
                          '' : 
                          `(${new Date(calculationResult.predictedDateSafety).toLocaleDateString('th-TH')})`
                        }
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium mb-2">ถึงเกณฑ์กฎหมาย (1.6 มม.)</div>
                      <div className="text-lg font-medium">
                        {calculationResult.daysToLegal === 9999 ? 
                          'ไม่สามารถคำนวณได้' : 
                          `อีกประมาณ ${calculationResult.daysToLegal} วัน`
                        }
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {calculationResult.daysToLegal === 9999 ? 
                          '' : 
                          `(${new Date(calculationResult.predictedDateLegal).toLocaleDateString('th-TH')})`
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">ผลการวิเคราะห์</h3>
                  <p>{calculationResult.analysisResult}</p>
                  
                  <div className="mt-4 p-4 border rounded-lg bg-muted">
                    <div className="font-medium mb-2">คำแนะนำ</div>
                    <p>{calculationResult.recommendation}</p>
                  </div>
                  
                  <div className="mt-4 text-sm text-muted-foreground">
                    <div className="font-medium mb-1">สูตรคำนวณ</div>
                    <p>{calculationResult.wearFormula}</p>
                    <div className="mt-2">
                      <span className="font-medium">ระดับความเชื่อมั่น: </span>
                      <span className={`
                        ${calculationResult.confidenceLevel === 'high' ? 'text-green-600' : 
                          calculationResult.confidenceLevel === 'medium' ? 'text-yellow-600' : 
                          'text-red-600'}
                      `}>
                        {calculationResult.confidenceLevel === 'high' ? 'สูง' : 
                         calculationResult.confidenceLevel === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog แสดงผลการคำนวณ */}
      <Dialog open={resultsVisible} onOpenChange={setResultsVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ผลการวิเคราะห์การสึกหรอของยาง</DialogTitle>
          </DialogHeader>
          {calculationResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">สถานะปัจจุบัน</div>
                  <div className={`text-lg font-bold ${
                    calculationResult.statusCode === 'critical' ? 'text-red-600' :
                    calculationResult.statusCode === 'warning' ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {calculationResult.status}
                  </div>
                  <div className="mt-2 text-sm">
                    ความลึกดอกยาง: {calculationResult.currentDepth.toFixed(1)} มม.
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">อัตราการสึกหรอ</div>
                  <div className="text-lg font-bold">
                    {calculationResult.wearRatePerDay.toFixed(4)} มม./วัน
                  </div>
                  <div className="mt-2 text-sm">
                    {calculationResult.wearRatePer1000Km.toFixed(2)} มม./1000กม.
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">การคาดการณ์</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">ถึงเกณฑ์ความปลอดภัย (3.0 มม.)</div>
                    <div className="text-lg font-medium">
                      {calculationResult.daysToSafety === 9999 ? 
                        'ไม่สามารถคำนวณได้' : 
                        `อีกประมาณ ${calculationResult.daysToSafety} วัน`
                      }
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {calculationResult.daysToSafety === 9999 ? 
                        '' : 
                        `(${new Date(calculationResult.predictedDateSafety).toLocaleDateString('th-TH')})`
                      }
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">ถึงเกณฑ์กฎหมาย (1.6 มม.)</div>
                    <div className="text-lg font-medium">
                      {calculationResult.daysToLegal === 9999 ? 
                        'ไม่สามารถคำนวณได้' : 
                        `อีกประมาณ ${calculationResult.daysToLegal} วัน`
                      }
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {calculationResult.daysToLegal === 9999 ? 
                        '' : 
                        `(${new Date(calculationResult.predictedDateLegal).toLocaleDateString('th-TH')})`
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">ผลการวิเคราะห์</h3>
                <p>{calculationResult.analysisResult}</p>
                
                <div className="mt-4 p-4 border rounded-lg bg-muted">
                  <div className="font-medium mb-2">คำแนะนำ</div>
                  <p>{calculationResult.recommendation}</p>
                </div>
              </div>
              
              <Button className="w-full" onClick={() => setResultsVisible(false)}>
                ปิด
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TireWearAdvancedCalculation;
