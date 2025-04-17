
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
  DialogTrigger,
  DialogDescription
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Plus, FileText, Loader2, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Tire {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  size: string;
  type: 'new' | 'retreaded';
  status: 'active' | 'maintenance' | 'retreading' | 'expired' | 'sold';
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
}

interface Installation {
  id: string;
  date: string;
  tireId: string;
  vehicleId: string;
  position: string;
  mileage: number;
  description: string;
  performedBy: string;
  notes: string;
}

const TireInstallation = () => {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [availableTires, setAvailableTires] = useState<Tire[]>([]);
  const [stockTires, setStockTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewTireDialogOpen, setIsNewTireDialogOpen] = useState(false);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState("installation");
  
  const [installFormData, setInstallFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: "",
    tireId: "",
    position: "",
    mileage: 0,
    description: "",
    performedBy: "",
    notes: ""
  });
  
  const [newTireFormData, setNewTireFormData] = useState({
    serialNumber: "",
    brand: "",
    model: "",
    size: "",
    type: "new" as 'new' | 'retreaded',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    supplier: "",
    treadDepth: 10,
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch installation logs
      const { data: installLogs, error: installError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'installation')
        .order('date', { ascending: false });
      
      if (installError) throw installError;
      
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, registration_number, brand, model, wheel_positions')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;
      
      // Fetch available tires
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('*')
        .is('vehicle_id', null)
        .eq('status', 'active')
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;
      
      // Fetch all tires in stock
      const { data: stockTiresData, error: stockError } = await supabase
        .from('tires')
        .select('*')
        .order('serial_number', { ascending: true });
      
      if (stockError) throw stockError;
      
      // Transform the fetched data
      const formattedVehicles: Vehicle[] = vehiclesData.map(vehicle => ({
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        brand: vehicle.brand,
        model: vehicle.model
      }));
      
      const formattedTires: Tire[] = tiresData.map(tire => ({
        id: tire.id,
        serialNumber: tire.serial_number,
        brand: tire.brand,
        model: tire.model,
        size: tire.size,
        type: tire.type as 'new' | 'retreaded',
        status: tire.status as 'active' | 'maintenance' | 'retreading' | 'expired' | 'sold'
      }));
      
      const formattedStockTires: Tire[] = stockTiresData.map(tire => ({
        id: tire.id,
        serialNumber: tire.serial_number,
        brand: tire.brand,
        model: tire.model,
        size: tire.size,
        type: tire.type as 'new' | 'retreaded',
        status: tire.status as 'active' | 'maintenance' | 'retreading' | 'expired' | 'sold'
      }));
      
      const formattedInstallations: Installation[] = installLogs?.map(log => ({
        id: log.id,
        date: log.date,
        tireId: log.tire_id,
        vehicleId: log.vehicle_id,
        position: log.position || '',
        mileage: log.mileage || 0,
        description: log.description || '',
        performedBy: log.performed_by || '',
        notes: log.notes || ''
      })) || [];
      
      setInstallations(formattedInstallations);
      setVehicles(formattedVehicles);
      setAvailableTires(formattedTires);
      setStockTires(formattedStockTires);
      
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

  const handleInstallFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInstallFormData(prev => ({
      ...prev,
      [name]: name === 'mileage' ? Number(value) : value
    }));
  };

  const handleNewTireFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTireFormData(prev => ({
      ...prev,
      [name]: ['purchasePrice', 'treadDepth'].includes(name) ? Number(value) : value
    }));
  };

  const handleSelectChange = (formType: 'install' | 'newTire', name: string, value: string) => {
    if (formType === 'install') {
      setInstallFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewTireFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleInstallTire = async () => {
    if (!installFormData.vehicleId || !installFormData.tireId || !installFormData.position) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกรถ ยาง และตำแหน่ง",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create activity log for installation
      const activityLog = {
        date: installFormData.date,
        activity_type: 'installation',
        tire_id: installFormData.tireId,
        vehicle_id: installFormData.vehicleId,
        position: installFormData.position,
        mileage: installFormData.mileage,
        description: installFormData.description,
        performed_by: installFormData.performedBy,
        notes: installFormData.notes
      };
      
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert(activityLog);
        
      if (logError) throw logError;
      
      // Update tire status and attach to vehicle
      const { error: tireError } = await supabase
        .from('tires')
        .update({ 
          status: 'active', 
          vehicle_id: installFormData.vehicleId,
          position: installFormData.position,
          updated_at: new Date().toISOString() 
        })
        .eq('id', installFormData.tireId);
        
      if (tireError) throw tireError;
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกการติดตั้งยางเรียบร้อยแล้ว"
      });
      
      // Reset form and refresh data
      setInstallFormData({
        date: new Date().toISOString().split('T')[0],
        vehicleId: "",
        tireId: "",
        position: "",
        mileage: 0,
        description: "",
        performedBy: "",
        notes: ""
      });
      
      setIsInstallDialogOpen(false);
      fetchData();
      
    } catch (error: any) {
      console.error("Error saving installation:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewTire = async () => {
    if (!newTireFormData.serialNumber || !newTireFormData.brand || !newTireFormData.model || !newTireFormData.size) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลยางให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Add new tire to inventory
      const newTire = {
        serial_number: newTireFormData.serialNumber,
        brand: newTireFormData.brand,
        model: newTireFormData.model,
        size: newTireFormData.size,
        type: newTireFormData.type,
        purchase_date: newTireFormData.purchaseDate,
        purchase_price: newTireFormData.purchasePrice,
        supplier: newTireFormData.supplier || "ไม่ระบุ",
        status: 'active',
        tread_depth: newTireFormData.treadDepth,
        mileage: 0,
        notes: newTireFormData.notes
      };
      
      const { error: tireError } = await supabase
        .from('tires')
        .insert(newTire);
        
      if (tireError) throw tireError;
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มยางใหม่เข้าคลังเรียบร้อยแล้ว"
      });
      
      // Reset form and refresh data
      setNewTireFormData({
        serialNumber: "",
        brand: "",
        model: "",
        size: "",
        type: "new",
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        supplier: "",
        treadDepth: 10,
        notes: ""
      });
      
      setIsNewTireDialogOpen(false);
      fetchData();
      
    } catch (error: any) {
      console.error("Error adding new tire:", error);
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
    const tire = stockTires.find(t => t.id === tireId);
    return tire ? `${tire.serialNumber} (${tire.brand} ${tire.size})` : '-';
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.brand} ${vehicle.model})` : '-';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'ใช้งาน';
      case 'maintenance': return 'ซ่อมบำรุง';
      case 'retreading': return 'หล่อดอก';
      case 'expired': return 'หมดอายุ';
      case 'sold': return 'ขายแล้ว';
      default: return status;
    }
  };

  const getPositionOptions = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return [];
    
    const positions = [];
    for (let i = 1; i <= 2; i++) {
      positions.push({ value: `front-${i === 1 ? 'left' : 'right'}`, label: `หน้า${i === 1 ? 'ซ้าย' : 'ขวา'}` });
    }
    
    for (let i = 1; i <= 4; i++) {
      positions.push({ 
        value: `rear-${i <= 2 ? 'left' : 'right'}-${i % 2 === 1 ? 'inner' : 'outer'}`, 
        label: `หลัง${i <= 2 ? 'ซ้าย' : 'ขวา'}-${i % 2 === 1 ? 'ใน' : 'นอก'}` 
      });
    }
    
    return positions;
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="installation" className="w-1/2">การติดตั้งยาง</TabsTrigger>
          <TabsTrigger value="inventory" className="w-1/2">คลังยาง</TabsTrigger>
        </TabsList>
        
        <TabsContent value="installation">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">บันทึกการติดตั้งยาง</h2>
            <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  บันทึกการติดตั้งยางใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>บันทึกการติดตั้งยาง</DialogTitle>
                  <DialogDescription>
                    ติดตั้งยางเข้ากับรถคันที่ต้องการและระบุตำแหน่งการติดตั้ง
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">วันที่ติดตั้ง</Label>
                      <Input 
                        id="date" 
                        name="date" 
                        type="date" 
                        value={installFormData.date}
                        onChange={handleInstallFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle">รถ</Label>
                      <Select 
                        value={installFormData.vehicleId} 
                        onValueChange={(value) => handleSelectChange("install", "vehicleId", value)}
                      >
                        <SelectTrigger id="vehicle">
                          <SelectValue placeholder="เลือกรถ" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.registrationNumber} ({vehicle.brand} {vehicle.model})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tire">ยางที่ติดตั้ง</Label>
                      <Select 
                        value={installFormData.tireId} 
                        onValueChange={(value) => handleSelectChange("install", "tireId", value)}
                      >
                        <SelectTrigger id="tire">
                          <SelectValue placeholder="เลือกยาง" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTires.length > 0 ? (
                            availableTires.map(tire => (
                              <SelectItem key={tire.id} value={tire.id}>
                                {tire.serialNumber} ({tire.brand} {tire.size})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="none">
                              ไม่มียางพร้อมติดตั้ง
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="position">ตำแหน่ง</Label>
                      <Select 
                        value={installFormData.position} 
                        onValueChange={(value) => handleSelectChange("install", "position", value)}
                        disabled={!installFormData.vehicleId}
                      >
                        <SelectTrigger id="position">
                          <SelectValue placeholder="เลือกตำแหน่ง" />
                        </SelectTrigger>
                        <SelectContent>
                          {getPositionOptions(installFormData.vehicleId).map(pos => (
                            <SelectItem key={pos.value} value={pos.value}>
                              {pos.label}
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
                        value={installFormData.mileage || ""}
                        onChange={handleInstallFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="performedBy">ผู้ดำเนินการ</Label>
                      <Input 
                        id="performedBy" 
                        name="performedBy" 
                        placeholder="เช่น นายสมศักดิ์" 
                        value={installFormData.performedBy}
                        onChange={handleInstallFormChange}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">รายละเอียดการติดตั้ง</Label>
                    <Input 
                      id="description" 
                      name="description" 
                      placeholder="รายละเอียดการติดตั้ง..." 
                      value={installFormData.description}
                      onChange={handleInstallFormChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      placeholder="รายละเอียดเพิ่มเติม..." 
                      value={installFormData.notes}
                      onChange={handleInstallFormChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsInstallDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleInstallTire} disabled={isSubmitting}>
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
              <CardTitle>ประวัติการติดตั้งยาง</CardTitle>
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
                      <TableHead>ยาง</TableHead>
                      <TableHead>ตำแหน่ง</TableHead>
                      <TableHead>เลขไมล์</TableHead>
                      <TableHead>ผู้ดำเนินการ</TableHead>
                      <TableHead className="text-right">รายละเอียด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installations.length > 0 ? (
                      installations.map((install) => (
                        <TableRow key={install.id}>
                          <TableCell>{new Date(install.date).toLocaleDateString('th-TH')}</TableCell>
                          <TableCell>{getVehicleName(install.vehicleId)}</TableCell>
                          <TableCell>{getTireName(install.tireId)}</TableCell>
                          <TableCell>{install.position}</TableCell>
                          <TableCell>{install.mileage?.toLocaleString()} กม.</TableCell>
                          <TableCell>{install.performedBy}</TableCell>
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
                          ไม่พบข้อมูลการติดตั้งยาง
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">คลังยาง</h2>
              <p className="text-sm text-muted-foreground">จัดการยางในคลัง และเพิ่มยางใหม่เข้าคลังโดยไม่ต้องติดตั้งกับรถ</p>
            </div>
            <Dialog open={isNewTireDialogOpen} onOpenChange={setIsNewTireDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Warehouse className="h-4 w-4 mr-2" />
                  เพิ่มยางเข้าคลัง
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>เพิ่มยางใหม่เข้าคลัง</DialogTitle>
                  <DialogDescription>
                    เพิ่มยางใหม่เข้าคลังเพื่อเตรียมพร้อมสำหรับการใช้งาน
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="serialNumber">ซีเรียลนัมเบอร์</Label>
                      <Input 
                        id="serialNumber" 
                        name="serialNumber" 
                        placeholder="เช่น BDG2021060001" 
                        value={newTireFormData.serialNumber}
                        onChange={handleNewTireFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="size">ขนาด</Label>
                      <Input 
                        id="size" 
                        name="size" 
                        placeholder="เช่น 11R22.5" 
                        value={newTireFormData.size}
                        onChange={handleNewTireFormChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brand">ยี่ห้อ</Label>
                      <Input 
                        id="brand" 
                        name="brand" 
                        placeholder="เช่น Bridgestone" 
                        value={newTireFormData.brand}
                        onChange={handleNewTireFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="model">รุ่น</Label>
                      <Input 
                        id="model" 
                        name="model" 
                        placeholder="เช่น R150" 
                        value={newTireFormData.model}
                        onChange={handleNewTireFormChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">ประเภท</Label>
                      <Select 
                        value={newTireFormData.type} 
                        onValueChange={(value: 'new' | 'retreaded') => handleSelectChange("newTire", "type", value)}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="เลือกประเภท" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">ยางใหม่</SelectItem>
                          <SelectItem value="retreaded">ยางหล่อดอก</SelectItem>
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
                        placeholder="เช่น 12.5" 
                        value={newTireFormData.treadDepth || ""}
                        onChange={handleNewTireFormChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="purchaseDate">วันที่ซื้อ</Label>
                      <Input 
                        id="purchaseDate" 
                        name="purchaseDate" 
                        type="date" 
                        value={newTireFormData.purchaseDate}
                        onChange={handleNewTireFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="purchasePrice">ราคาซื้อ (บาท)</Label>
                      <Input 
                        id="purchasePrice" 
                        name="purchasePrice" 
                        type="number" 
                        placeholder="เช่น 8500" 
                        value={newTireFormData.purchasePrice || ""}
                        onChange={handleNewTireFormChange}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">ผู้จำหน่าย</Label>
                    <Input 
                      id="supplier" 
                      name="supplier" 
                      placeholder="เช่น บริษัท ไทยบริดจสโตน จำกัด" 
                      value={newTireFormData.supplier}
                      onChange={handleNewTireFormChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      placeholder="รายละเอียดเพิ่มเติม..." 
                      value={newTireFormData.notes}
                      onChange={handleNewTireFormChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewTireDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleAddNewTire} disabled={isSubmitting}>
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
              <CardTitle>รายการยางในคลัง</CardTitle>
              <CardDescription>ยางที่พร้อมใช้งานและยังไม่ได้ติดตั้งกับรถ</CardDescription>
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
                      <TableHead>ซีเรียลนัมเบอร์</TableHead>
                      <TableHead>ยี่ห้อ/รุ่น</TableHead>
                      <TableHead>ขนาด</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>ความลึกดอกยาง</TableHead>
                      <TableHead>ระยะทางใช้งาน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockTires.length > 0 ? (
                      stockTires
                        .filter(tire => !tire.vehicle_id)
                        .map((tire) => (
                        <TableRow key={tire.id}>
                          <TableCell>{tire.serialNumber}</TableCell>
                          <TableCell>{tire.brand} {tire.model}</TableCell>
                          <TableCell>{tire.size}</TableCell>
                          <TableCell>{tire.type === 'new' ? 'ยางใหม่' : 'ยางหล่อดอก'}</TableCell>
                          <TableCell>{getStatusLabel(tire.status)}</TableCell>
                          <TableCell>{tire.treadDepth?.toFixed(1) || '-'} มม.</TableCell>
                          <TableCell>{tire.mileage?.toLocaleString() || '0'} กม.</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          ไม่พบข้อมูลยางในคลัง
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TireInstallation;
