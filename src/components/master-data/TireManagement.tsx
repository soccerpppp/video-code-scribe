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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Tire } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useMultiSelect } from "@/hooks/useMultiSelect";

const TireManagement = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('tires')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "ลบสำเร็จ",
        description: `ลบข้อมูลยาง ${selectedIds.size} เส้นเรียบร้อยแล้ว`
      });

      clearSelection();
      fetchTires();
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
    setIsDeleteDialogOpen(false);
    setCurrentTire(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="w-1/3">
          <Input
            placeholder="ค้นหาตาม Serial, ยี่ห้อ หรือ รุ่น..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                      checked={selectedIds.size === filteredTires.length && filteredTires.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>ยี่ห้อ</TableHead>
                  <TableHead>รุ่น</TableHead>
                  <TableHead>ขนาด</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ความลึกดอกยาง (มม.)</TableHead>
                  <TableHead>ระยะทางใช้งาน (กม.)</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTires.length > 0 ? (
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
    </div>
  );
};

export default TireManagement;
