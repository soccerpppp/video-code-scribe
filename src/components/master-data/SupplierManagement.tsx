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
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import type { Supplier } from "@/types/models";
import ExcelImport from "./ExcelImport";
import { utils, writeFile } from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedData = data.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          contactPerson: supplier.contact_person,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          notes: supplier.notes
        }));
        
        setSuppliers(formattedData);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้จำหน่ายได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleExcelImportSuccess = () => {
    fetchSuppliers();
  };

  const handleExportToExcel = () => {
    const exportData = suppliers.map(supplier => ({
      'ชื่อบริษัท/ร้าน': supplier.name,
      'ผู้ติดต่อ': supplier.contactPerson,
      'เบอร์โทรศัพท์': supplier.phone,
      'อีเมล': supplier.email,
      'ที่อยู่': supplier.address,
      'หมายเหตุ': supplier.notes
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Suppliers");
    writeFile(wb, "suppliers.xlsx");
  };

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
          <ExcelImport type="suppliers" onImportSuccess={handleExcelImportSuccess} />
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก Excel
          </Button>
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
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">ชื่อบริษัท/ร้าน</Label>
                  <Input id="name" placeholder="เช่น บริษัท ไทยบริดจสโตน จำกัด" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contactPerson">ชื่อผู้ติดต่อ</Label>
                    <Input id="contactPerson" placeholder="เช่น คุณสมชาย ใจดี" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                    <Input id="phone" placeholder="เช่น 02-123-4567" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" type="email" placeholder="เช่น contact@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">ที่อยู่</Label>
                  <Input id="address" placeholder="เช่น 123 ถนนพระราม 4 คลองเตย กรุงเทพฯ 10110" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Input id="notes" placeholder="รายละเอียดเพิ่มเติม..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  บันทึก
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการผู้จำหน่ายทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">กำลังโหลดข้อมูล...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อบริษัท/ร้าน</TableHead>
                  <TableHead>ผู้ติดต่อ</TableHead>
                  <TableHead>เบอร์โทรศัพท์</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">ไม่พบข้อมูล</TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contactPerson}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
