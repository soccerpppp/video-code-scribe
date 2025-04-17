
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const TireChange = () => {
  const [changes, setChanges] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [vehicles, setVehicles] = useState<{id: string; name: string}[]>([]);
  const [tires, setTires] = useState<{id: string; name: string}[]>([]);
  const [newTires, setNewTires] = useState<{id: string; name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: "",
    oldTireId: "",
    newTireId: "",
    mileage: 0,
    cost: 0,
    description: "",
    performedBy: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch change logs
      const { data: changeLogs, error: changesError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'change')
        .order('date', { ascending: false });
      
      if (changesError) throw changesError;
      
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, registration_number, brand, model')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;
      
      // Fetch all tires
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('id, serial_number, brand, model, size, type, status')
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;
      
      // Transform the fetched data
      const formattedVehicles = vehiclesData.map(vehicle => ({
        id: vehicle.id,
        name: `${vehicle.registration_number} (${vehicle.brand})`
      }));
      
      const formattedTires = tiresData.map(tire => ({
        id: tire.id,
        name: `${tire.serial_number} (${tire.brand} ${tire.size}) - ${tire.status}`
      }));

      // Filter tires for new ones (active, not installed)
      const formattedNewTires = tiresData
        .filter(tire => tire.status === 'active' && !tire.vehicle_id)
        .map(tire => ({
          id: tire.id,
          name: `${tire.serial_number} (${tire.brand} ${tire.size}) - ${tire.type === 'new' ? 'ยางใหม่' : 'ยางหล่อดอก'}`
        }));
      
      setChanges(changeLogs || []);
      setVehicles(formattedVehicles);
      setTires(formattedTires);
      setNewTires(formattedNewTires);
      
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
    if (!formData.vehicleId || !formData.oldTireId || !formData.newTireId) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกรถและยาง",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create activity log for tire change
      const activityLog = {
        date: formData.date,
        activity_type: 'change',
        tire_id: formData.oldTireId,
        vehicle_id: formData.vehicleId,
        mileage: formData.mileage,
        cost: formData.cost,
        description: formData.description,
        performed_by: formData.performedBy,
        new_tire_id: formData.newTireId,
        notes: formData.notes
      };
      
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert(activityLog);
        
      if (logError) throw logError;
      
      // Update old tire status
      const { error: oldTireError } = await supabase
        .from('tires')
        .update({ 
          status: 'maintenance', 
          vehicle_id: null,
          position: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.oldTireId);
        
      if (oldTireError) throw oldTireError;
      
      // Update new tire status and link to vehicle
      const { error: newTireError } = await supabase
        .from('tires')
        .update({ 
          status: 'active', 
          vehicle_id: formData.vehicleId,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.newTireId);
        
      if (newTireError) throw newTireError;
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกการเปลี่ยนยางเรียบร้อยแล้ว"
      });
      
      // Reset form and refresh data
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vehicleId: "",
        oldTireId: "",
        newTireId: "",
        mileage: 0,
        cost: 0,
        description: "",
        performedBy: "",
        notes: ""
      });
      
      setIsAddDialogOpen(false);
      fetchData();
      
    } catch (error: any) {
      console.error("Error saving tire change:", error);
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

  const getNewTireName = (tireId: string) => {
    const tire = newTires.find(t => t.id === tireId);
    return tire ? tire.name.split(' ')[0] : '-';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">บันทึกการเปลี่ยนยาง</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              บันทึกการเปลี่ยนยางใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>บันทึกการเปลี่ยนยาง</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">วันที่เปลี่ยน</Label>
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
                  <Label htmlFor="oldTire">ยางเก่าที่ถอดออก</Label>
                  <Select 
                    value={formData.oldTireId} 
                    onValueChange={(value) => handleSelectChange("oldTireId", value)}
                  >
                    <SelectTrigger id="oldTire">
                      <SelectValue placeholder="เลือกยางเก่า" />
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
                  <Label htmlFor="newTire">ยางใหม่ที่ติดตั้ง</Label>
                  <Select 
                    value={formData.newTireId} 
                    onValueChange={(value) => handleSelectChange("newTireId", value)}
                  >
                    <SelectTrigger id="newTire">
                      <SelectValue placeholder="เลือกยางใหม่" />
                    </SelectTrigger>
                    <SelectContent>
                      {newTires.map(tire => (
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
                    placeholder="เช่น 30000" 
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
                    placeholder="เช่น 8500" 
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
                <Label htmlFor="description">สาเหตุการเปลี่ยน</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="บรรยายสาเหตุการเปลี่ยนยาง..." 
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
          <CardTitle>ประวัติการเปลี่ยนยาง</CardTitle>
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
                  <TableHead>รถ</TableHead>
                  <TableHead>ยางเก่า / ยางใหม่</TableHead>
                  <TableHead>เลขไมล์</TableHead>
                  <TableHead>สาเหตุการเปลี่ยน</TableHead>
                  <TableHead>ค่าใช้จ่าย</TableHead>
                  <TableHead className="text-right">รายละเอียด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.length > 0 ? (
                  changes.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell>{new Date(change.date).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>
                        {getVehicleName(change.vehicleId)}
                      </TableCell>
                      <TableCell>
                        {getTireName(change.tireId)} / {change.newTireId && getTireName(change.newTireId)}
                      </TableCell>
                      <TableCell>{change.mileage?.toLocaleString()} กม.</TableCell>
                      <TableCell>{change.description}</TableCell>
                      <TableCell>{change.cost?.toLocaleString()} บาท</TableCell>
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
                      ไม่พบข้อมูลการเปลี่ยนยาง
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

export default TireChange;
