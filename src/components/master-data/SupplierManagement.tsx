
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Supplier } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลผู้จำหน่ายได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('suppliers').insert([{
        name: formData.name,
        contact_name: formData.contactPerson,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address,
        notes: formData.notes || null
      }]);

      if (error) throw error;

      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มข้อมูลผู้จำหน่ายเรียบร้อยแล้ว"
      });

      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        notes: ""
      });
      setIsAddDialogOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (selectedSuppliers.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .in('id', Array.from(selectedSuppliers));

      if (error) throw error;

      toast({
        title: "ลบสำเร็จ",
        description: `ลบข้อมูลผู้จำหน่าย ${selectedSuppliers.size} รายการเรียบร้อยแล้ว`
      });

      setSelectedSuppliers(new Set());
      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredSuppliers.map(supplier => supplier.id);
      setSelectedSuppliers(new Set(allIds));
    } else {
      setSelectedSuppliers(new Set());
    }
  };

  const toggleSupplierSelection = (supplierId: string) => {
    const newSelection = new Set(selectedSuppliers);
    if (newSelection.has(supplierId)) {
      newSelection.delete(supplierId);
    } else {
      newSelection.add(supplierId);
    }
    setSelectedSuppliers(newSelection);
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="w-1/3">
          <Input
            placeholder="ค้นหาตามชื่อหรือผู้ติดต่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มผู้จำหน่ายใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>เพิ่มข้อมูลผู้จำหน่ายใหม่</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">ชื่อบริษัท/ร้าน</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="เช่น บริษัท ไทยบริดจสโตน จำกัด"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactPerson">ชื่อผู้ติดต่อ</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        placeholder="เช่น คุณสมชาย ใจดี"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="เช่น 02-123-4567"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="เช่น contact@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">ที่อยู่</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="เช่น 123 ถนนพระราม 4 คลองเตย กรุงเทพฯ 10110"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="รายละเอียดเพิ่มเติม..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังบันทึก...</>
                    ) : (
                      'บันทึก'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          {selectedSuppliers.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบที่เลือก ({selectedSuppliers.size})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการผู้จำหน่ายทั้งหมด</CardTitle>
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
                      checked={selectedSuppliers.size === filteredSuppliers.length && filteredSuppliers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ชื่อบริษัท/ร้าน</TableHead>
                  <TableHead>ผู้ติดต่อ</TableHead>
                  <TableHead>เบอร์โทรศัพท์</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSuppliers.has(supplier.id)}
                          onCheckedChange={() => toggleSupplierSelection(supplier.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contactPerson}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      ไม่พบข้อมูลผู้จำหน่าย
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

export default SupplierManagement;
