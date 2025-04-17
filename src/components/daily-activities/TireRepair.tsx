
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, FileText, Loader2 } from "lucide-react";
import { ActivityLog } from "@/types/models";
import { supabase, snakeToCamel } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const TireRepair = () => {
  const [repairs, setRepairs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [vehicles, setVehicles] = useState<{id: string; name: string}[]>([]);
  const [tires, setTires] = useState<{id: string; name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: "",
    tireId: "",
    mileage: 0,
    cost: 0,
    description: "",
    performedBy: "",
    repairType: "inside",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch repair logs
      const { data: repairLogs, error: repairsError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'repair')
        .order('date', { ascending: false });
      
      if (repairsError) throw repairsError;
      
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, registration_number, brand, model')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;
      
      // Fetch tires
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('id, serial_number, brand, model, size')
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;
      
      // Transform the fetched data with the snakeToCamel helper
      const formattedRepairs: ActivityLog[] = snakeToCamel<ActivityLog[]>(repairLogs || []);
      
      const formattedVehicles = vehiclesData?.map(vehicle => ({
        id: vehicle.id,
        name: `${vehicle.registration_number} (${vehicle.brand})`
      })) || [];
      
      const formattedTires = tiresData?.map(tire => ({
        id: tire.id,
        name: `${tire.serial_number} (${tire.brand} ${tire.size})`
      })) || [];
      
      setRepairs(formattedRepairs);
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
      [name]: ['mileage', 'cost'].includes(name) ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.vehicleId || !formData.tireId) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกรถและยาง",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const activityLog = {
        date: formData.date,
        activity_type: 'repair',
        tire_id: formData.tireId,
        vehicle_id: formData.vehicleId,
        mileage: formData.mileage,
        cost: formData.cost,
        description: formData.description,
        performed_by: formData.performedBy,
        notes: `${formData.repairType === 'inside' ? 'ซ่อมภายใน' : 'ส่งซ่อมภายนอก'}: ${formData.notes}`
      };
      
      const { error } = await supabase
        .from('activity_logs')
        .insert(activityLog);
        
      if (error) throw error;
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกการซ่อมยางเรียบร้อยแล้ว"
      });
      
      // Reset form and refresh data
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vehicleId: "",
        tireId: "",
        mileage: 0,
        cost: 0,
        description: "",
        performedBy: "",
        repairType: "inside",
        notes: ""
      });
      
      setIsAddDialogOpen(false);
      fetchData();
      
    } catch (error: any) {
      console.error("Error saving repair log:", error);
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
        <h2 className="text-xl font-semibold">บันทึกการซ่อมยาง</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              บันทึกการซ่อมยางใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>บันทึกการซ่อมยาง</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">วันที่ซ่อม</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repairType">ประเภทการซ่อม</Label>
                  <Select 
                    value={formData.repairType} 
                    onValueChange={(value) => handleSelectChange("repairType", value)}
                  >
                    <SelectTrigger id="repairType">
                      <SelectValue placeholder="เลือกประเภทการซ่อม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inside">ซ่อมภายใน</SelectItem>
                      <SelectItem value="outside">ส่งซ่อมภายนอก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      {tires.map(tire => (
                        <SelectItem key={tire.id} value={tire.id}>
                          {tire.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="cost">ค่าใช้จ่าย (บาท)</Label>
                  <Input 
                    id="cost" 
                    name="cost" 
                    type="number" 
                    placeholder="เช่น 500" 
                    value={formData.cost || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="performedBy">ผู้ดำเนินการ</Label>
                <Input 
                  id="performedBy" 
                  name="performedBy" 
                  placeholder="เช่น ช่างสมศักดิ์" 
                  value={formData.performedBy}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">รายละเอียดการซ่อม</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="บรรยายรายละเอียดการซ่อม..." 
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
          <CardTitle>ประวัติการซ่อมยาง</CardTitle>
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
                  <TableHead>เลขไมล์</TableHead>
                  <TableHead>รายละเอียดการซ่อม</TableHead>
                  <TableHead>ค่าใช้จ่าย</TableHead>
                  <TableHead>ผู้ดำเนินการ</TableHead>
                  <TableHead className="text-right">รายละเอียด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.length > 0 ? (
                  repairs.map((repair) => (
                    <TableRow key={repair.id}>
                      <TableCell>{new Date(repair.date).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>
                        {getVehicleName(repair.vehicleId)} / {getTireName(repair.tireId)}
                      </TableCell>
                      <TableCell>{repair.mileage?.toLocaleString()} กม.</TableCell>
                      <TableCell>{repair.description}</TableCell>
                      <TableCell>{repair.cost?.toLocaleString()} บาท</TableCell>
                      <TableCell>{repair.performedBy}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      ไม่พบข้อมูลการซ่อมยาง
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

export default TireRepair;
