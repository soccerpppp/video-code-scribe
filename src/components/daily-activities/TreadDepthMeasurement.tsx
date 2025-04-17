
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { ActivityLog } from "@/types/models";
import { supabase, snakeToCamel } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const TreadDepthMeasurement = () => {
  const [measurements, setMeasurements] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [vehicles, setVehicles] = useState<{id: string; name: string}[]>([]);
  const [tires, setTires] = useState<{id: string; name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: "",
    tireId: "",
    treadDepth: 0,
    mileage: 0,
    performedBy: "",
    description: "วัดความลึกดอกยางตามระยะเวลา",
    notes: ""
  });

  // เกณฑ์ความลึกดอกยางต่ำสุดที่ปลอดภัย (มม.)
  const minimumSafeTreadDepth = 5.0;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch measurement logs
      const { data: measurementLogs, error: measurementsError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'measure')
        .order('date', { ascending: false });
      
      if (measurementsError) throw measurementsError;
      
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, registration_number, brand, model')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;
      
      // Fetch tires
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('id, serial_number, brand, model, size, status')
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;
      
      // Transform the fetched data with the snakeToCamel helper
      const formattedMeasurements: ActivityLog[] = snakeToCamel<ActivityLog[]>(measurementLogs || []);
      
      const formattedVehicles = vehiclesData?.map(vehicle => ({
        id: vehicle.id,
        name: `${vehicle.registration_number} (${vehicle.brand})`
      })) || [];
      
      const formattedTires = tiresData?.map(tire => ({
        id: tire.id,
        name: `${tire.serial_number} (${tire.brand} ${tire.size}) - ${tire.status}`
      })) || [];
      
      setMeasurements(formattedMeasurements);
      setVehicles(formattedVehicles);
      setTires(formattedTires);
      
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['treadDepth', 'mileage'].includes(name) ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.vehicleId || !formData.tireId || !formData.treadDepth) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกรถ ยาง และความลึกดอกยาง",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Generate notes based on tread depth
      const isBelowThreshold = formData.treadDepth < minimumSafeTreadDepth;
      const autoNotes = isBelowThreshold ? 
        "ความลึกดอกยางต่ำกว่าเกณฑ์ ควรเปลี่ยนเร็วๆ นี้" : 
        "ความลึกดอกยางอยู่ในเกณฑ์ปกติ";
      
      const finalNotes = formData.notes ? 
        `${autoNotes}; ${formData.notes}` : 
        autoNotes;
      
      // Create activity log
      const activityLog = {
        date: formData.date,
        activity_type: 'measure',
        tire_id: formData.tireId,
        vehicle_id: formData.vehicleId,
        mileage: formData.mileage,
        cost: 0,
        description: formData.description,
        performed_by: formData.performedBy,
        measurement_value: formData.treadDepth,
        notes: finalNotes
      };
      
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert(activityLog);
        
      if (logError) throw logError;
      
      // Update tire's tread depth
      const { error: tireError } = await supabase
        .from('tires')
        .update({ 
          tread_depth: formData.treadDepth,
          updated_at: new Date().toISOString() 
        })
        .eq('id', formData.tireId);
        
      if (tireError) throw tireError;
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกการวัดความลึกดอกยางเรียบร้อยแล้ว"
      });
      
      // Reset form and refresh data
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vehicleId: "",
        tireId: "",
        treadDepth: 0,
        mileage: 0,
        performedBy: "",
        description: "วัดความลึกดอกยางตามระยะเวลา",
        notes: ""
      });
      
      setIsAddDialogOpen(false);
      fetchData();
      
    } catch (error: any) {
      console.error("Error saving measurement:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTireName = (tireId: string) => {
    const tire = tires.find(t => t.id === tireId);
    return tire ? tire.name.split(' ')[0] : '-';
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.name.split(' ')[0] : '-';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">บันทึกการวัดความลึกดอกยาง</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              บันทึกการวัดความลึกดอกยางใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>บันทึกการวัดความลึกดอกยาง</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">วันที่วัด</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicle">รถ</Label>
                  <Select 
                    value={formData.vehicleId} 
                    onValueChange={(value) => handleSelectChange("vehicleId", value)}
                  >
                    <SelectTrigger id="vehicle">
                      <SelectValue placeholder="เลือกรถ" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tire">ยาง</Label>
                  <Select 
                    value={formData.tireId} 
                    onValueChange={(value) => handleSelectChange("tireId", value)}
                  >
                    <SelectTrigger id="tire">
                      <SelectValue placeholder="เลือกยาง" />
                    </SelectTrigger>
                    <SelectContent>
                      {tires
                        .filter(tire => tire.name.includes('active'))
                        .map(tire => (
                          <SelectItem key={tire.id} value={tire.id}>
                            {tire.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="treadDepth">ความลึกดอกยาง (มม.)</Label>
                  <Input 
                    id="treadDepth" 
                    name="treadDepth" 
                    type="number" 
                    step="0.1" 
                    placeholder="เช่น 8.5" 
                    value={formData.treadDepth || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="mileage">เลขไมล์ (กม.)</Label>
                  <Input 
                    id="mileage" 
                    name="mileage" 
                    type="number" 
                    placeholder="เช่น 35000" 
                    value={formData.mileage || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="performedBy">ผู้วัด</Label>
                  <Input 
                    id="performedBy" 
                    name="performedBy" 
                    placeholder="เช่น นายสมบัติ" 
                    value={formData.performedBy}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">จุดประสงค์การวัด</Label>
                <Input 
                  id="description" 
                  name="description" 
                  placeholder="เช่น วัดความลึกดอกยางตามระยะเวลา" 
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Input 
                  id="notes" 
                  name="notes" 
                  placeholder="รายละเอียดเพิ่มเติม..." 
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึก'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติการวัดความลึกดอกยาง</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>รถ/ยาง</TableHead>
                  <TableHead>ความลึกดอกยาง</TableHead>
                  <TableHead>เลขไมล์</TableHead>
                  <TableHead>ผู้วัด</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">รายละเอียด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.length > 0 ? (
                  measurements.map((measurement) => {
                    const measurementValue = measurement.measurementValue || 0;
                    const isBelowThreshold = measurementValue < minimumSafeTreadDepth;
                    
                    return (
                      <TableRow key={measurement.id}>
                        <TableCell>{new Date(measurement.date).toLocaleDateString('th-TH')}</TableCell>
                        <TableCell>
                          {getVehicleName(measurement.vehicleId)} / {getTireName(measurement.tireId)}
                        </TableCell>
                        <TableCell>
                          <span className={isBelowThreshold ? "text-red-600 font-semibold" : ""}>
                            {measurementValue.toFixed(1)} มม.
                          </span>
                        </TableCell>
                        <TableCell>{measurement.mileage?.toLocaleString()} กม.</TableCell>
                        <TableCell>{measurement.performedBy}</TableCell>
                        <TableCell>
                          {isBelowThreshold ? (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span>ต่ำกว่าเกณฑ์</span>
                            </div>
                          ) : (
                            <span className="text-green-600">ปกติ</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      ไม่พบข้อมูลการวัดความลึกดอกยาง
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreadDepthMeasurement;
