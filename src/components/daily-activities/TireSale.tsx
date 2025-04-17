
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

const TireSale = () => {
  const [sales, setSales] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [vehicles, setVehicles] = useState<{id: string; name: string}[]>([]);
  const [expiredTires, setExpiredTires] = useState<{id: string; name: string}[]>([]);
  
  const [buyers, setBuyers] = useState([
    { id: "1", name: "ร้านรับซื้อยางเก่า นครชัย" },
    { id: "2", name: "บริษัท รีไซเคิลยาง จำกัด" },
    { id: "3", name: "ร้านวรเชษฐ์ยางเก่า" },
  ]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: "",
    tireId: "",
    salePrice: 0,
    buyer: "",
    mileage: 0,
    performedBy: "",
    description: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch sale logs
      const { data: saleLogs, error: salesError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'sale')
        .order('date', { ascending: false });
      
      if (salesError) throw salesError;
      
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, registration_number, brand, model')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;
      
      // Fetch expired/damaged tires
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('id, serial_number, brand, model, size, status')
        .in('status', ['expired', 'maintenance'])
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;
      
      // Transform the fetched data with the snakeToCamel helper
      const formattedSales: ActivityLog[] = snakeToCamel<ActivityLog[]>(saleLogs || []);
      
      const formattedVehicles = vehiclesData?.map(vehicle => ({
        id: vehicle.id,
        name: `${vehicle.registration_number} (${vehicle.brand})`
      })) || [];
      
      const formattedExpiredTires = tiresData?.map(tire => ({
        id: tire.id,
        name: `${tire.serial_number} (${tire.brand} ${tire.size}) - ${tire.status}`
      })) || [];
      
      setSales(formattedSales);
      setVehicles(formattedVehicles);
      setExpiredTires(formattedExpiredTires);
      
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
      [name]: ['salePrice', 'mileage'].includes(name) ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.tireId || !formData.buyer || !formData.salePrice) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลยาง ผู้ซื้อ และราคาขาย",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create activity log for sale
      const activityLog = {
        date: formData.date,
        activity_type: 'sale',
        tire_id: formData.tireId,
        vehicle_id: formData.vehicleId || null,
        mileage: formData.mileage,
        cost: 0,
        description: formData.description,
        performed_by: formData.performedBy,
        sale_price: formData.salePrice,
        buyer: formData.buyer,
        notes: formData.notes
      };
      
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert(activityLog);
        
      if (logError) throw logError;
      
      // Update tire status
      const { error: tireError } = await supabase
        .from('tires')
        .update({ 
          status: 'sold', 
          vehicle_id: null,
          position: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.tireId);
        
      if (tireError) throw tireError;
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกการขายยางเรียบร้อยแล้ว"
      });
      
      // Reset form and refresh data
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vehicleId: "",
        tireId: "",
        salePrice: 0,
        buyer: "",
        mileage: 0,
        performedBy: "",
        description: "",
        notes: ""
      });
      
      setIsAddDialogOpen(false);
      fetchData();
      
    } catch (error: any) {
      console.error("Error saving tire sale:", error);
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
    const tire = expiredTires.find(t => t.id === tireId);
    return tire ? tire.name.split(' ')[0] : '-';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">บันทึกการขายยาง</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              บันทึกการขายยางใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>บันทึกการขายยาง</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">วันที่ขาย</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicle">รถ (ถ้ามี)</Label>
                  <Select 
                    value={formData.vehicleId} 
                    onValueChange={(value) => handleSelectChange("vehicleId", value)}
                  >
                    <SelectTrigger id="vehicle">
                      <SelectValue placeholder="เลือกรถ (หากมี)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ไม่เกี่ยวข้องกับรถ</SelectItem>
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
                  <Label htmlFor="tire">ยางที่ขาย</Label>
                  <Select 
                    value={formData.tireId} 
                    onValueChange={(value) => handleSelectChange("tireId", value)}
                  >
                    <SelectTrigger id="tire">
                      <SelectValue placeholder="เลือกยาง" />
                    </SelectTrigger>
                    <SelectContent>
                      {expiredTires.map(tire => (
                        <SelectItem key={tire.id} value={tire.id}>
                          {tire.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="buyer">ผู้ซื้อ</Label>
                  <Select 
                    value={formData.buyer} 
                    onValueChange={(value) => handleSelectChange("buyer", value)}
                  >
                    <SelectTrigger id="buyer">
                      <SelectValue placeholder="เลือกผู้ซื้อ" />
                    </SelectTrigger>
                    <SelectContent>
                      {buyers.map(buyer => (
                        <SelectItem key={buyer.id} value={buyer.name}>
                          {buyer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="salePrice">ราคาขาย (บาท)</Label>
                  <Input 
                    id="salePrice" 
                    name="salePrice" 
                    type="number" 
                    placeholder="เช่น 1500" 
                    value={formData.salePrice || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mileage">เลขไมล์สะสม (กม.)</Label>
                  <Input 
                    id="mileage" 
                    name="mileage" 
                    type="number" 
                    placeholder="เช่น 40000" 
                    value={formData.mileage || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="performedBy">ผู้ดำเนินการ</Label>
                <Input 
                  id="performedBy" 
                  name="performedBy" 
                  placeholder="เช่น นายสมบัติ" 
                  value={formData.performedBy}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">สาเหตุการขาย</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="บรรยายสาเหตุการขายยาง..." 
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
          <CardTitle>ประวัติการขายยาง</CardTitle>
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
                  <TableHead>ยางที่ขาย</TableHead>
                  <TableHead>ผู้ซื้อ</TableHead>
                  <TableHead>ราคาขาย</TableHead>
                  <TableHead>เลขไมล์สะสม</TableHead>
                  <TableHead>สาเหตุการขาย</TableHead>
                  <TableHead className="text-right">รายละเอียด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length > 0 ? (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{new Date(sale.date).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>
                        {getTireName(sale.tireId)}
                      </TableCell>
                      <TableCell>{sale.buyer}</TableCell>
                      <TableCell>{sale.salePrice?.toLocaleString()} บาท</TableCell>
                      <TableCell>{sale.mileage?.toLocaleString()} กม.</TableCell>
                      <TableCell>{sale.description}</TableCell>
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
                      ไม่พบข้อมูลการขายยาง
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

export default TireSale;
