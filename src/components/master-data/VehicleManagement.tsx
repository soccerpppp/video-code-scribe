
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
import { Vehicle } from "@/types/models";

const VehicleManagement = () => {
  // ตัวอย่างข้อมูลรถ
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "1",
      registrationNumber: "70-8001",
      type: "รถบรรทุก 10 ล้อ",
      brand: "HINO",
      model: "FM8J",
      wheelPositions: 10,
      currentMileage: 45000,
      tirePositions: [
        { position: "หน้าซ้าย", tireId: "T001" },
        { position: "หน้าขวา", tireId: "T002" },
        { position: "หลังซ้ายนอก (1)", tireId: "T003" },
        { position: "หลังซ้ายใน (1)", tireId: "T004" },
        { position: "หลังขวานอก (1)", tireId: "T005" },
        { position: "หลังขวาใน (1)", tireId: "T006" },
        { position: "หลังซ้ายนอก (2)", tireId: "T007" },
        { position: "หลังซ้ายใน (2)", tireId: "T008" },
        { position: "หลังขวานอก (2)", tireId: "T009" },
        { position: "หลังขวาใน (2)", tireId: "T010" },
      ],
      notes: "รถกระบะพื้นเรียบ"
    },
    {
      id: "2",
      registrationNumber: "70-7520",
      type: "รถบรรทุก 6 ล้อ",
      brand: "ISUZU",
      model: "FTR",
      wheelPositions: 6,
      currentMileage: 32000,
      tirePositions: [
        { position: "หน้าซ้าย", tireId: "T011" },
        { position: "หน้าขวา", tireId: "T012" },
        { position: "หลังซ้ายนอก", tireId: "T013" },
        { position: "หลังซ้ายใน", tireId: "T014" },
        { position: "หลังขวานอก", tireId: "T015" },
        { position: "หลังขวาใน", tireId: "T016" },
      ],
      notes: "รถตู้ทึบ"
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="registrationNumber">ทะเบียนรถ</Label>
                  <Input id="registrationNumber" placeholder="เช่น 70-8001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">ประเภทรถ</Label>
                  <Input id="type" placeholder="เช่น รถบรรทุก 10 ล้อ" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">ยี่ห้อ</Label>
                  <Input id="brand" placeholder="เช่น HINO" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">รุ่น</Label>
                  <Input id="model" placeholder="เช่น FM8J" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="wheelPositions">จำนวนล้อ</Label>
                  <Input id="wheelPositions" type="number" placeholder="เช่น 10" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentMileage">เลขไมล์ปัจจุบัน (กม.)</Label>
                  <Input id="currentMileage" type="number" placeholder="เช่น 45000" />
                </div>
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
          <CardTitle>รายการรถทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
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
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.registrationNumber}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                  <TableCell>{vehicle.wheelPositions}</TableCell>
                  <TableCell>{vehicle.currentMileage.toLocaleString()} กม.</TableCell>
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

export default VehicleManagement;
