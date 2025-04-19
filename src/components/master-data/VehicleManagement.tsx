
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
import { Vehicle } from "@/types/models";
import ExcelImport from "./ExcelImport";
import { utils, writeFile } from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to fetch vehicles from Supabase
  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform snake_case to camelCase
        const formattedData = data.map(vehicle => ({
          id: vehicle.id,
          registrationNumber: vehicle.registration_number,
          type: vehicle.type,
          brand: vehicle.brand,
          model: vehicle.model,
          wheelPositions: vehicle.wheel_positions,
          currentMileage: vehicle.current_mileage,
          tirePositions: [],
          notes: vehicle.notes
        }));
        
        setVehicles(formattedData);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรถได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleExcelImportSuccess = () => {
    fetchVehicles();
  };

  const handleExportToExcel = () => {
    const exportData = vehicles.map(vehicle => ({
      'ทะเบียนรถ': vehicle.registrationNumber,
      'ประเภทรถ': vehicle.type,
      'ยี่ห้อ': vehicle.brand,
      'รุ่น': vehicle.model,
      'จำนวนล้อ': vehicle.wheelPositions,
      'ระยะทางปัจจุบัน': vehicle.currentMileage,
      'หมายเหตุ': vehicle.notes
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Vehicles");
    writeFile(wb, "vehicles.xlsx");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="w-1/3">
          <Input
            placeholder="ค้นหาตามทะเบียน, ยี่ห้อ, รุ่น..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <ExcelImport type="vehicles" onImportSuccess={handleExcelImportSuccess} />
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก Excel
          </Button>
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
                <div className="grid gap-2">
                  <Label htmlFor="registrationNumber">ทะเบียนรถ</Label>
                  <Input id="registrationNumber" placeholder="เช่น 1กก1234" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">ประเภทรถ</Label>
                    <Input id="type" placeholder="เช่น รถบรรทุก 6 ล้อ" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="brand">ยี่ห้อ</Label>
                    <Input id="brand" placeholder="เช่น Isuzu" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="model">รุ่น</Label>
                    <Input id="model" placeholder="เช่น FRR90" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="wheelPositions">จำนวนล้อ</Label>
                    <Input id="wheelPositions" type="number" placeholder="เช่น 6" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentMileage">ระยะทางปัจจุบัน</Label>
                  <Input id="currentMileage" type="number" placeholder="เช่น 150000" />
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
          <CardTitle>รายการรถทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">กำลังโหลดข้อมูล...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ทะเบียนรถ</TableHead>
                  <TableHead>ประเภทรถ</TableHead>
                  <TableHead>ยี่ห้อ</TableHead>
                  <TableHead>รุ่น</TableHead>
                  <TableHead>จำนวนล้อ</TableHead>
                  <TableHead>ระยะทาง (กม.)</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">ไม่พบข้อมูล</TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.registrationNumber}</TableCell>
                      <TableCell>{vehicle.type}</TableCell>
                      <TableCell>{vehicle.brand}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.wheelPositions}</TableCell>
                      <TableCell>{vehicle.currentMileage}</TableCell>
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

export default VehicleManagement;
