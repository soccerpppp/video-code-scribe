
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Vehicle {
  id: string;
  registration_number: string;
  type: string;
  brand: string;
  model: string;
  wheel_positions: number;
  current_mileage: number;
  notes?: string;
}

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    registration_number: "",
    type: "",
    brand: "",
    model: "",
    wheel_positions: 0,
    current_mileage: 0,
    notes: ""
  });

  // Load vehicles from Supabase
  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('registration_number', { ascending: true });
        
      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลรถได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'wheel_positions' || name === 'current_mileage' ? Number(value) : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (currentVehicle) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update({
            registration_number: formData.registration_number,
            type: formData.type,
            brand: formData.brand,
            model: formData.model,
            wheel_positions: formData.wheel_positions,
            current_mileage: formData.current_mileage,
            notes: formData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentVehicle.id);
          
        if (error) throw error;
        
        toast({
          title: "บันทึกสำเร็จ",
          description: "อัปเดตข้อมูลรถเรียบร้อยแล้ว",
        });
        
        setIsEditDialogOpen(false);
      } else {
        // Add new vehicle
        const { error } = await supabase
          .from('vehicles')
          .insert({
            registration_number: formData.registration_number,
            type: formData.type,
            brand: formData.brand,
            model: formData.model,
            wheel_positions: formData.wheel_positions,
            current_mileage: formData.current_mileage,
            notes: formData.notes
          });
          
        if (error) throw error;
        
        toast({
          title: "บันทึกสำเร็จ",
          description: "เพิ่มข้อมูลรถใหม่เรียบร้อยแล้ว",
        });
        
        setIsAddDialogOpen(false);
      }
      
      // Refresh vehicles list
      fetchVehicles();
      
      // Reset form
      resetForm();
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete vehicle
  const handleDelete = async () => {
    if (!currentVehicle) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', currentVehicle.id);
        
      if (error) throw error;
      
      toast({
        title: "ลบสำเร็จ",
        description: "ลบข้อมูลรถเรียบร้อยแล้ว",
      });
      
      // Refresh vehicles list
      fetchVehicles();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog with vehicle data
  const openEditDialog = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setFormData({
      registration_number: vehicle.registration_number,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      wheel_positions: vehicle.wheel_positions,
      current_mileage: vehicle.current_mileage,
      notes: vehicle.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      registration_number: "",
      type: "",
      brand: "",
      model: "",
      wheel_positions: 0,
      current_mileage: 0,
      notes: ""
    });
    setCurrentVehicle(null);
  };

  // Close add dialog and reset form
  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    resetForm();
  };

  // Close edit dialog and reset form
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="w-1/3">
          <Input
            placeholder="ค้นหาตามทะเบียน ประเภท หรือ ยี่ห้อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มรถใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>เพิ่มข้อมูลรถใหม่</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="registration_number">ทะเบียนรถ</Label>
                    <Input 
                      id="registration_number" 
                      name="registration_number"
                      value={formData.registration_number}
                      onChange={handleChange}
                      placeholder="เช่น 70-8001" 
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">ประเภทรถ</Label>
                    <Input 
                      id="type" 
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      placeholder="เช่น รถบรรทุก 10 ล้อ" 
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="brand">ยี่ห้อ</Label>
                    <Input 
                      id="brand" 
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="เช่น HINO" 
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">รุ่น</Label>
                    <Input 
                      id="model" 
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="เช่น FM8J" 
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="wheel_positions">จำนวนล้อ</Label>
                    <Input 
                      id="wheel_positions" 
                      name="wheel_positions"
                      type="number" 
                      value={formData.wheel_positions || ""}
                      onChange={handleChange}
                      placeholder="เช่น 10" 
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="current_mileage">เลขไมล์ปัจจุบัน (กม.)</Label>
                    <Input 
                      id="current_mileage" 
                      name="current_mileage"
                      type="number" 
                      value={formData.current_mileage || ""}
                      onChange={handleChange}
                      placeholder="เช่น 45000" 
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Textarea 
                    id="notes" 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="รายละเอียดเพิ่มเติม..." 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeAddDialog}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting}>
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
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการรถทั้งหมด</CardTitle>
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
                  <TableHead>ทะเบียนรถ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ยี่ห้อ/รุ่น</TableHead>
                  <TableHead>จำนวนล้อ</TableHead>
                  <TableHead>เลขไมล์ปัจจุบัน</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.registration_number}</TableCell>
                      <TableCell>{vehicle.type}</TableCell>
                      <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                      <TableCell>{vehicle.wheel_positions}</TableCell>
                      <TableCell>{vehicle.current_mileage.toLocaleString()} กม.</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditDialog(vehicle)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => openDeleteDialog(vehicle)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      ไม่พบข้อมูลรถ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลรถ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="registration_number">ทะเบียนรถ</Label>
                  <Input 
                    id="edit_registration_number" 
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    placeholder="เช่น 70-8001" 
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">ประเภทรถ</Label>
                  <Input 
                    id="edit_type" 
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    placeholder="เช่น รถบรรทุก 10 ล้อ" 
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">ยี่ห้อ</Label>
                  <Input 
                    id="edit_brand" 
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="เช่น HINO" 
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">รุ่น</Label>
                  <Input 
                    id="edit_model" 
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="เช่น FM8J" 
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="wheel_positions">จำนวนล้อ</Label>
                  <Input 
                    id="edit_wheel_positions" 
                    name="wheel_positions"
                    type="number" 
                    value={formData.wheel_positions || ""}
                    onChange={handleChange}
                    placeholder="เช่น 10" 
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="current_mileage">เลขไมล์ปัจจุบัน (กม.)</Label>
                  <Input 
                    id="edit_current_mileage" 
                    name="current_mileage"
                    type="number" 
                    value={formData.current_mileage || ""}
                    onChange={handleChange}
                    placeholder="เช่น 45000" 
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea 
                  id="edit_notes" 
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="รายละเอียดเพิ่มเติม..." 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบข้อมูลรถ</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>คุณต้องการลบข้อมูลรถทะเบียน {currentVehicle?.registration_number} ใช่หรือไม่?</p>
            <p className="text-sm text-red-500 mt-2">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
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
    </div>
  );
};

export default VehicleManagement;
