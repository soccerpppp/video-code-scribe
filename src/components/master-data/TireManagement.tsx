
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Tire } from "@/types/models";

const TireManagement = () => {
  // ตัวอย่างข้อมูลยาง
  const [tires, setTires] = useState<Tire[]>([
    {
      id: "T001",
      serialNumber: "BDG2021060001",
      brand: "Bridgestone",
      model: "R150",
      size: "11R22.5",
      type: "new",
      position: "หน้าซ้าย",
      vehicleId: "1",
      purchaseDate: "2023-01-15",
      purchasePrice: 8500,
      supplier: "บริษัท ไทยบริดจสโตน จำกัด",
      status: "active",
      treadDepth: 12.5,
      mileage: 10000,
      notes: "ยางใหม่ล่าสุด"
    },
    {
      id: "T002",
      serialNumber: "BDG2021060002",
      brand: "Bridgestone",
      model: "R150",
      size: "11R22.5",
      type: "new",
      position: "หน้าขวา",
      vehicleId: "1",
      purchaseDate: "2023-01-15",
      purchasePrice: 8500,
      supplier: "บริษัท ไทยบริดจสโตน จำกัด",
      status: "active",
      treadDepth: 12.3,
      mileage: 10000,
      notes: ""
    },
    {
      id: "T011",
      serialNumber: "MCH2022010015",
      brand: "Michelin",
      model: "XZE2+",
      size: "11R22.5",
      type: "new",
      position: "หน้าซ้าย",
      vehicleId: "2",
      purchaseDate: "2023-03-10",
      purchasePrice: 9200,
      supplier: "บริษัท สยามมิชลิน จำกัด",
      status: "active",
      treadDepth: 11.8,
      mileage: 8000,
      notes: ""
    },
    {
      id: "T020",
      serialNumber: "OTH2022050030",
      brand: "Otani",
      model: "OH-110",
      size: "11R22.5",
      type: "retreaded",
      vehicleId: undefined, // ยางที่ยังไม่ได้ติดตั้ง
      purchaseDate: "2023-05-20",
      purchasePrice: 5500,
      supplier: "บริษัท โอตานิ จำกัด",
      status: "maintenance",
      treadDepth: 13.0,
      mileage: 0,
      notes: "ยางหล่อดอกใหม่"
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  const filteredTires = tires.filter(tire => {
    // กรองตามคำค้นหา
    const matchesSearch = 
      tire.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    // กรองตามสถานะ
    const matchesStatus = filterStatus === 'all' || tire.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 w-2/3">
          <Input
            className="w-1/2"
            placeholder="ค้นหาตามซีเรียล ยี่ห้อ หรือรุ่น..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select 
            value={filterStatus} 
            onValueChange={setFilterStatus}
          >
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มยางใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>เพิ่มข้อมูลยางใหม่</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="serialNumber">ซีเรียลนัมเบอร์</Label>
                  <Input id="serialNumber" placeholder="เช่น BDG2021060001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="size">ขนาด</Label>
                  <Input id="size" placeholder="เช่น 11R22.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">ยี่ห้อ</Label>
                  <Input id="brand" placeholder="เช่น Bridgestone" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">รุ่น</Label>
                  <Input id="model" placeholder="เช่น R150" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">ประเภท</Label>
                  <Select defaultValue="new">
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
                  <Input id="treadDepth" type="number" step="0.1" placeholder="เช่น 12.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="purchaseDate">วันที่ซื้อ</Label>
                  <Input id="purchaseDate" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchasePrice">ราคาซื้อ (บาท)</Label>
                  <Input id="purchasePrice" type="number" placeholder="เช่น 8500" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier">ผู้จำหน่าย</Label>
                <Input id="supplier" placeholder="เช่น บริษัท ไทยบริดจสโตน จำกัด" />
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
          <CardTitle>รายการยางทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ซีเรียลนัมเบอร์</TableHead>
                <TableHead>ยี่ห้อ/รุ่น</TableHead>
                <TableHead>ขนาด</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>ความลึกดอกยาง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTires.map((tire) => (
                <TableRow key={tire.id}>
                  <TableCell className="font-medium">{tire.serialNumber}</TableCell>
                  <TableCell>{tire.brand} {tire.model}</TableCell>
                  <TableCell>{tire.size}</TableCell>
                  <TableCell>{tire.position || '-'}</TableCell>
                  <TableCell>{tire.treadDepth} มม.</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tire.status)}>
                      {getStatusText(tire.status)}
                    </Badge>
                  </TableCell>
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

export default TireManagement;
