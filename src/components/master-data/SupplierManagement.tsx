
import { useState } from "react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Supplier } from "@/types/models";

const SupplierManagement = () => {
  // ตัวอย่างข้อมูลผู้จำหน่าย
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: "1",
      name: "บริษัท ไทยบริดจสโตน จำกัด",
      contactPerson: "คุณสมชาย ใจดี",
      phone: "02-123-4567",
      email: "contact@thaibridgestone.co.th",
      address: "123 ถนนพระราม 4 คลองเตย กรุงเทพฯ 10110",
      notes: "ตัวแทนยาง Bridgestone อย่างเป็นทางการ"
    },
    {
      id: "2",
      name: "บริษัท สยามมิชลิน จำกัด",
      contactPerson: "คุณสมหญิง รักยาง",
      phone: "02-123-7890",
      email: "support@siammichelin.co.th",
      address: "456 ถนนสุขุมวิท บางนา กรุงเทพฯ 10260",
      notes: "ตัวแทนยาง Michelin อย่างเป็นทางการ"
    },
    {
      id: "3",
      name: "ห้างหุ้นส่วนจำกัด ยางทองการยาง",
      contactPerson: "คุณทองดี มั่งมี",
      phone: "081-234-5678",
      email: "yangtong@gmail.com",
      address: "789 ถนนมิตรภาพ เมือง นครราชสีมา 30000",
      notes: "จำหน่ายยางทุกยี่ห้อ รับหล่อดอกยาง"
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

      <Card>
        <CardHeader>
          <CardTitle>รายการผู้จำหน่ายทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
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
              {filteredSuppliers.map((supplier) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierManagement;
