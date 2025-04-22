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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
<<<<<<< HEAD
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Checkbox } from "@/components/ui/checkbox";

interface TireFromDB {
  id: string;
  serial_number: string;
  brand: string;
  model: string;
  size: string;
  type: string;
  position: string | null;
  vehicle_id: string | null;
  purchase_date: string;
  purchase_price: number;
  supplier: string;
  status: string;
  tread_depth: number;
  mileage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Tire {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  size: string;
  type: 'new' | 'retreaded';
  position: string | null;
  vehicle_id: string | null;
  purchaseDate: string;
  purchasePrice: number;
  supplier: string;
  status: 'active' | 'maintenance' | 'retreading' | 'expired' | 'sold';
  treadDepth: number;
  mileage: number;
  notes?: string;
}

interface VehicleFromDB {
  id: string;
  registration_number: string;
  brand: string;
  model: string;
  type: string;
  wheel_positions: number;
  current_mileage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
  type: string;
  wheelPositions: number;
  currentMileage: number;
  notes?: string;
  tirePositions: [];
}
=======
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Tire } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useMultiSelect } from "@/hooks/useMultiSelect";
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85

const TireManagement = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
<<<<<<< HEAD
  const [currentTire, setCurrentTire] = useState<Tire | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<"add" | "edit" | "delete" | "bulkDelete" | null>(null);

=======
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
  const [formData, setFormData] = useState({
    serialNumber: "",
    brand: "",
    model: "",
    size: "",
    type: "new",
    position: "",
    vehicleId: "",
    purchaseDate: "",
    purchasePrice: 0,
    supplier: "",
    status: "active",
    treadDepth: 0,
    mileage: 0,
    notes: "",
  });
  const [currentTire, setCurrentTire] = useState<Tire | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedIds, handleSelectAll, toggleSelection, clearSelection } = useMultiSelect(tires);

  const fetchTires = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tires")
        .select("*")
        .order("serial_number", { ascending: true });
      if (error) throw error;

      const formattedTires = data?.map((tire) => ({
        id: tire.id,
        serialNumber: tire.serial_number,
        brand: tire.brand,
        model: tire.model,
        size: tire.size,
        type: tire.type as "new" | "retreaded",
        position: tire.position,
        vehicleId: tire.vehicle_id,
        purchaseDate: tire.purchase_date,
        purchasePrice: tire.purchase_price,
        supplier: tire.supplier,
        status: tire.status as "active" | "maintenance" | "retreading" | "expired" | "sold",
        treadDepth: tire.tread_depth,
        mileage: tire.mileage,
        notes: tire.notes,
      })) || [];

      setTires(formattedTires);
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลยางได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTires();
  }, []);

<<<<<<< HEAD
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'retreading': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      case 'sold': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'ใช้งาน';
      case 'maintenance': return 'ซ่อมบำรุง';
      case 'retreading': return 'หล่อดอก';
      case 'expired': return 'หมดอายุ';
      case 'sold': return 'ขายแล้ว';
      default: return status;
    }
  };

  const getTreadDepthStatus = (depth: number) => {
    if (depth < 3) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        text: "อันตราย ต้องเปลี่ยนยางทันที",
        color: "text-red-500"
      };
    } else if (depth >= 3 && depth <= 5) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        text: "เปลี่ยนยางก่อนเอารถออกใช้งาน",
        color: "text-yellow-500"
      };
    } else {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        text: "ใช้งานได้",
        color: "text-green-500"
      };
    }
  };

  const filteredTires = tires.filter(tire => {
    const matchesSearch = 
      tire.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || tire.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['purchase_price', 'tread_depth', 'mileage'].includes(name) ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? null : value
    }));
  };

=======
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        serialNumber,
        brand,
        model,
        size,
        type,
        position,
        vehicleId,
        purchaseDate,
        purchasePrice,
        supplier,
        status,
        treadDepth,
        mileage,
        notes,
      } = formData;

      const payload = {
        serial_number: serialNumber,
        brand: brand,
        model: model,
        size: size,
        type: type,
        position: position || null,
        vehicle_id: vehicleId || null,
        purchase_date: purchaseDate,
        purchase_price: purchasePrice,
        supplier: supplier,
        status: status,
        tread_depth: treadDepth,
        mileage: mileage,
        notes: notes || null,
      };

      if (isEditDialogOpen && currentTire) {
        const { error } = await supabase
          .from("tires")
          .update(payload)
          .eq("id", currentTire.id);
        if (error) throw error;
        toast({ title: "บันทึกสำเร็จ", description: "แก้ไขข้อมูลยางเรียบร้อยแล้ว" });
      } else {
        const { error } = await supabase.from("tires").insert([payload]);
        if (error) throw error;
        toast({ title: "บันทึกสำเร็จ", description: "เพิ่มข้อมูลยางเรียบร้อยแล้ว" });
      }

      fetchTires();
      closeDialog();
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

<<<<<<< HEAD
  const handleDelete = async (ids: string[]) => {
    setIsSubmitting(true);
    try {
      // อัปเดต tire_activity_logs ที่อ้างถึงยางเหล่านี้ให้ tire_id = null ก่อน
      await supabase.from('tire_activity_logs').update({ tire_id: null }).in('tire_id', ids);
      // แล้วค่อยลบยาง
      const { error } = await supabase.from('tires').delete().in('id', ids);
=======
  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('tires')
        .delete()
        .in('id', Array.from(selectedIds));

>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
      if (error) throw error;

      toast({
        title: "ลบสำเร็จ",
<<<<<<< HEAD
        description: `ลบข้อมูลยาง ${ids.length} รายการเรียบร้อยแล้ว`,
      });
      fetchData();
      setSelectedIds([]);
      closeDialog();
=======
        description: `ลบข้อมูลยาง ${selectedIds.size} เส้นเรียบร้อยแล้ว`
      });

      clearSelection();
      fetchTires();
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredTires = tires.filter(
    (tire) =>
      tire.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDialog = (type: "add" | "edit", tire?: Tire) => {
    if (type === "add") {
      setFormData({
        serialNumber: "",
        brand: "",
        model: "",
        size: "",
        type: "new",
        position: "",
        vehicleId: "",
        purchaseDate: "",
        purchasePrice: 0,
        supplier: "",
        status: "active",
        treadDepth: 0,
        mileage: 0,
        notes: "",
      });
      setCurrentTire(null);
      setIsAddDialogOpen(true);
      setIsEditDialogOpen(false);
      setIsDeleteDialogOpen(false);
    } else if (type === "edit" && tire) {
      setFormData({
        serialNumber: tire.serialNumber,
        brand: tire.brand,
        model: tire.model,
        size: tire.size,
        type: tire.type,
        position: tire.position || "",
        vehicleId: tire.vehicleId || "",
        purchaseDate: tire.purchaseDate,
        purchasePrice: tire.purchasePrice,
        supplier: tire.supplier,
        status: tire.status,
        treadDepth: tire.treadDepth,
        mileage: tire.mileage,
        notes: tire.notes || "",
      });
      setCurrentTire(tire);
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(true);
      setIsDeleteDialogOpen(false);
    }
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
<<<<<<< HEAD
    resetForm();
  };

  const closeDialog = () => {
    setDialog(null);
    setCurrentTire(null);
    resetForm();
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => 
      prev.length === filteredTires.length ? [] : filteredTires.map(t => t.id)
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getVehicleName = (id: string | null) => {
    if (!id) return '-';
    const vehicle = vehicles.find(v => v.id === id);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.brand} ${vehicle.model})` : '-';
=======
    setIsDeleteDialogOpen(false);
    setCurrentTire(null);
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
<<<<<<< HEAD
        <div className="flex items-center gap-4">
          <div className="flex gap-4 w-2/3">
            <Input
              className="w-1/2"
              placeholder="ค้นหาตามซีเรียล ยี่ห้อ หรือรุ่น..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-1/3">
                <SelectValue placeholder="สถานะทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
                <SelectItem value="retreading">หล่อดอก</SelectItem>
                <SelectItem value="expired">หมดอายุ</SelectItem>
                <SelectItem value="sold">ขายแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setDialog("bulkDelete")}
            >
              ลบรายการที่เลือก ({selectedIds.length})
            </Button>
          )}
=======
        <div className="w-1/3">
          <Input
            placeholder="ค้นหาตาม Serial, ยี่ห้อ หรือ รุ่น..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog("add")}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มยางใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>เพิ่มข้อมูลยางใหม่</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        value={formData.serialNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, serialNumber: e.target.value })
                        }
                        placeholder="เช่น ABC123456"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="brand">ยี่ห้อ</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="เช่น Michelin"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="model">รุ่น</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="เช่น Pilot Sport 4"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="size">ขนาด</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        placeholder="เช่น 225/45R17"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">ประเภท</Label>
                      <select
                        id="type"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as "new" | "retreaded" })}
                      >
                        <option value="new">ใหม่</option>
                        <option value="retreaded">หล่อดอก</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">สถานะ</Label>
                      <select
                        id="status"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as "active" | "maintenance" | "retreading" | "expired" | "sold" })
                        }
                      >
                        <option value="active">ใช้งาน</option>
                        <option value="maintenance">ซ่อมบำรุง</option>
                        <option value="retreading">หล่อดอก</option>
                        <option value="expired">หมดอายุ</option>
                        <option value="sold">ขายแล้ว</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="purchaseDate">วันที่ซื้อ</Label>
                      <Input
                        type="date"
                        id="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={(e) =>
                          setFormData({ ...formData, purchaseDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="purchasePrice">ราคาซื้อ</Label>
                      <Input
                        type="number"
                        id="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={(e) =>
                          setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })
                        }
                        placeholder="เช่น 2500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="treadDepth">ความลึกดอกยาง (มม.)</Label>
                      <Input
                        type="number"
                        id="treadDepth"
                        value={formData.treadDepth}
                        onChange={(e) =>
                          setFormData({ ...formData, treadDepth: parseFloat(e.target.value) })
                        }
                        placeholder="เช่น 8"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mileage">ระยะทางใช้งาน (กม.)</Label>
                      <Input
                        type="number"
                        id="mileage"
                        value={formData.mileage}
                        onChange={(e) =>
                          setFormData({ ...formData, mileage: parseFloat(e.target.value) })
                        }
                        placeholder="เช่น 10000"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplier">ผู้จัดจำหน่าย</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="เช่น บ. ABC จำกัด"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="รายละเอียดเพิ่มเติม..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังบันทึก...</>
                    ) : (
                      "บันทึก"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบที่เลือก ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการยางทั้งหมด</CardTitle>
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
                  <TableHead className="w-[50px]">
                    <Checkbox
<<<<<<< HEAD
                      checked={selectedIds.length === filteredTires.length && filteredTires.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ซีเรียลนัมเบอร์</TableHead>
                  <TableHead>ยี่ห้อ/รุ่น</TableHead>
                  <TableHead>ขนาด</TableHead>
                  <TableHead>ยานพาหนะ</TableHead>
                  <TableHead>ความลึกดอกยาง</TableHead>
                  <TableHead>สถานะดอกยาง</TableHead>
=======
                      checked={selectedIds.size === filteredTires.length && filteredTires.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>ยี่ห้อ</TableHead>
                  <TableHead>รุ่น</TableHead>
                  <TableHead>ขนาด</TableHead>
                  <TableHead>ประเภท</TableHead>
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ความลึกดอกยาง (มม.)</TableHead>
                  <TableHead>ระยะทางใช้งาน (กม.)</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTires.length > 0 ? (
<<<<<<< HEAD
                  filteredTires.map((tire) => {
                    const treadStatus = getTreadDepthStatus(tire.treadDepth);
                    return (
                      <TableRow key={tire.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(tire.id)}
                            onCheckedChange={() => toggleSelect(tire.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{tire.serialNumber}</TableCell>
                        <TableCell>{tire.brand} {tire.model}</TableCell>
                        <TableCell>{tire.size}</TableCell>
                        <TableCell>{getVehicleName(tire.vehicle_id)}</TableCell>
                        <TableCell>{tire.treadDepth} มม.</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {treadStatus.icon}
                            <span className={treadStatus.color}>{treadStatus.text}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(tire.status)}>
                            {getStatusText(tire.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(tire)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => openDeleteDialog(tire)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
=======
                  filteredTires.map((tire) => (
                    <TableRow key={tire.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(tire.id)}
                          onCheckedChange={() => toggleSelection(tire.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{tire.serialNumber}</TableCell>
                      <TableCell>{tire.brand}</TableCell>
                      <TableCell>{tire.model}</TableCell>
                      <TableCell>{tire.size}</TableCell>
                      <TableCell>{tire.type}</TableCell>
                      <TableCell>{tire.status}</TableCell>
                      <TableCell>{tire.treadDepth}</TableCell>
                      <TableCell>{tire.mileage}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog("edit", tire)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
                      ไม่พบข้อมูลยาง
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลยาง</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                    placeholder="เช่น ABC123456"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">ยี่ห้อ</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="เช่น Michelin"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="model">รุ่น</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="เช่น Pilot Sport 4"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="size">ขนาด</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="เช่น 225/45R17"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">ประเภท</Label>
                  <select
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "new" | "retreaded" })}
                  >
                    <option value="new">ใหม่</option>
                    <option value="retreaded">หล่อดอก</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">สถานะ</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "active" | "maintenance" | "retreading" | "expired" | "sold" })
                    }
                  >
                    <option value="active">ใช้งาน</option>
                    <option value="maintenance">ซ่อมบำรุง</option>
                    <option value="retreading">หล่อดอก</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="sold">ขายแล้ว</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="purchaseDate">วันที่ซื้อ</Label>
                  <Input
                    type="date"
                    id="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchasePrice">ราคาซื้อ</Label>
                  <Input
                    type="number"
                    id="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })
                    }
                    placeholder="เช่น 2500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="treadDepth">ความลึกดอกยาง (มม.)</Label>
                  <Input
                    type="number"
                    id="treadDepth"
                    value={formData.treadDepth}
                    onChange={(e) =>
                      setFormData({ ...formData, treadDepth: parseFloat(e.target.value) })
                    }
                    placeholder="เช่น 8"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mileage">ระยะทางใช้งาน (กม.)</Label>
                  <Input
                    type="number"
                    id="mileage"
                    value={formData.mileage}
                    onChange={(e) =>
                      setFormData({ ...formData, mileage: parseFloat(e.target.value) })
                    }
                    placeholder="เช่น 10000"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="supplier">ผู้จัดจำหน่าย</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="เช่น บ. ABC จำกัด"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังบันทึก...</>
                ) : (
                  "บันทึก"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
<<<<<<< HEAD

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบข้อมูลยาง</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>คุณต้องการลบข้อมูลยางซีเรียล {currentTire?.serialNumber} ใช่หรือไม่?</p>
            <p className="text-sm text-red-500 mt-2">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={() => handleDelete([currentTire?.id || ""])} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                'ลบ'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "bulkDelete"} onOpenChange={v => !v && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบข้อมูล</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>คุณต้องการลบข้อมูลยางที่เลือก {selectedIds.length} รายการ ใช่หรือไม่?</p>
            <p className="text-sm text-red-500 mt-2">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(selectedIds)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                'ลบ'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
=======
>>>>>>> a564af6e4d37948a4601d43337a16d5949a30e85
    </div>
  );
};

export default TireManagement;
