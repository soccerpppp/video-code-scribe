
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, FileSpreadsheet, Upload, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { Tire, Vehicle, ActivityLog } from '@/types/models';

interface TireWearExcelImporterProps {
  tires: Tire[];
  vehicles: Vehicle[];
  onImportComplete: () => void;
}

interface MeasurementData {
  tireId: string;
  vehicleId: string;
  date: string;
  treadDepth: number;
  mileage?: number;
  position?: string;
  performedBy?: string;
  notes?: string;
}

export const TireWearExcelImporter = ({ tires, vehicles, onImportComplete }: TireWearExcelImporterProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<MeasurementData[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setExcelFile(file);
    parseExcel(file);
  };

  const parseExcel = async (file: File) => {
    setIsLoading(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // แปลงข้อมูลจาก Excel
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // ตรวจสอบและแปลงข้อมูลให้ตรงกับรูปแบบที่ต้องการ
      const measurements: MeasurementData[] = [];
      
      for (const row of jsonData) {
        const rowData = row as any;
        
        // หา ID ของยางจาก serial number
        let tireId = '';
        if (rowData['รหัสยาง'] || rowData['Serial Number'] || rowData['tire_id']) {
          const tireSerial = rowData['รหัสยาง'] || rowData['Serial Number'] || rowData['tire_id'];
          const tire = tires.find(t => t.serialNumber === tireSerial || t.id === tireSerial);
          if (tire) {
            tireId = tire.id;
          } else {
            console.warn(`ไม่พบยางรหัส ${tireSerial}`);
            continue;
          }
        } else {
          console.warn('ไม่พบข้อมูลรหัสยาง');
          continue;
        }
        
        // หา ID ของรถจากทะเบียนรถ
        let vehicleId = '';
        if (rowData['ทะเบียนรถ'] || rowData['Registration Number'] || rowData['vehicle_id']) {
          const regNumber = rowData['ทะเบียนรถ'] || rowData['Registration Number'] || rowData['vehicle_id'];
          const vehicle = vehicles.find(v => v.registrationNumber === regNumber || v.id === regNumber);
          if (vehicle) {
            vehicleId = vehicle.id;
          } else {
            console.warn(`ไม่พบรถทะเบียน ${regNumber}`);
            continue;
          }
        } else {
          console.warn('ไม่พบข้อมูลทะเบียนรถ');
          continue;
        }
        
        // แปลงข้อมูลวันที่
        let date = '';
        if (rowData['วันที่'] || rowData['Date'] || rowData['date']) {
          const rawDate = rowData['วันที่'] || rowData['Date'] || rowData['date'];
          // ถ้าเป็นวันที่ในรูปแบบ Excel (serial number)
          if (typeof rawDate === 'number') {
            date = new Date(Math.round((rawDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
          } 
          // ถ้าเป็นวันที่ในรูปแบบ string
          else if (typeof rawDate === 'string') {
            try {
              const d = new Date(rawDate);
              date = d.toISOString().split('T')[0];
            } catch (e) {
              console.warn(`รูปแบบวันที่ไม่ถูกต้อง: ${rawDate}`);
              continue;
            }
          } else {
            console.warn('รูปแบบวันที่ไม่ถูกต้อง');
            continue;
          }
        } else {
          date = new Date().toISOString().split('T')[0];
        }
        
        // ความลึกดอกยาง
        let treadDepth = 0;
        if (rowData['ความลึกดอกยาง'] || rowData['Tread Depth'] || rowData['tread_depth']) {
          treadDepth = parseFloat(rowData['ความลึกดอกยาง'] || rowData['Tread Depth'] || rowData['tread_depth']);
          if (isNaN(treadDepth)) {
            console.warn('ความลึกดอกยางไม่ถูกต้อง');
            continue;
          }
        } else {
          console.warn('ไม่พบข้อมูลความลึกดอกยาง');
          continue;
        }
        
        // ข้อมูลเพิ่มเติม (ไม่บังคับ)
        const mileage = rowData['ระยะทาง'] || rowData['Mileage'] || rowData['mileage'];
        const position = rowData['ตำแหน่ง'] || rowData['Position'] || rowData['position'];
        const performedBy = rowData['ผู้วัด'] || rowData['Performed By'] || rowData['performed_by'];
        const notes = rowData['หมายเหตุ'] || rowData['Notes'] || rowData['notes'];
        
        // เพิ่มข้อมูลที่แปลงแล้วลงในรายการ
        measurements.push({
          tireId,
          vehicleId,
          date,
          treadDepth,
          mileage: mileage ? parseFloat(mileage) : undefined,
          position: position ? String(position) : undefined,
          performedBy: performedBy ? String(performedBy) : undefined,
          notes: notes ? String(notes) : undefined
        });
      }
      
      setPreviewData(measurements);
      
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอ่านไฟล์ Excel ได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData.length) {
      toast({
        title: "ไม่พบข้อมูล",
        description: "ไม่มีข้อมูลที่จะนำเข้า",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // เตรียมข้อมูลสำหรับการบันทึกใน Supabase
      const activityLogs = previewData.map(item => ({
        date: item.date,
        activity_type: 'measure',
        tire_id: item.tireId,
        vehicle_id: item.vehicleId,
        position: item.position,
        mileage: item.mileage,
        measurement_value: item.treadDepth,
        performed_by: item.performedBy,
        notes: item.notes,
        description: 'นำเข้าข้อมูลจาก Excel'
      }));
      
      // บันทึกข้อมูลลงใน activity_logs
      const { error } = await supabase
        .from('activity_logs')
        .insert(activityLogs);
        
      if (error) throw error;
      
      // อัปเดตค่าความลึกดอกยางล่าสุดของยางแต่ละเส้น
      for (const item of previewData) {
        const { error: updateError } = await supabase
          .from('tires')
          .update({ 
            tread_depth: item.treadDepth,
            updated_at: new Date().toISOString() 
          })
          .eq('id', item.tireId);
          
        if (updateError) {
          console.error(`Error updating tire ${item.tireId}:`, updateError);
        }
      }
      
      toast({
        title: "นำเข้าข้อมูลสำเร็จ",
        description: `นำเข้าข้อมูลการวัดยาง ${previewData.length} รายการ`,
      });
      
      setIsDialogOpen(false);
      setPreviewData([]);
      setExcelFile(null);
      
      // เรียกใช้ callback เพื่อรีเฟรชข้อมูล
      onImportComplete();
      
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถนำเข้าข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTemplate = () => {
    try {
      // สร้างข้อมูลตัวอย่างสำหรับไฟล์แม่แบบ
      const sampleData = [
        {
          'รหัสยาง': 'รหัสซีเรียลยาง',
          'ทะเบียนรถ': 'ทะเบียนรถ',
          'วันที่': new Date().toLocaleDateString('th-TH'),
          'ความลึกดอกยาง': 10.5,
          'ระยะทาง': 10000,
          'ตำแหน่ง': 'FL',
          'ผู้วัด': 'ชื่อผู้วัด',
          'หมายเหตุ': 'บันทึกเพิ่มเติม'
        }
      ];
      
      // สร้าง worksheet
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      
      // สร้าง workbook และเพิ่ม worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ข้อมูลการวัดยาง');
      
      // สร้างไฟล์ Excel และดาวน์โหลด
      XLSX.writeFile(workbook, 'แม่แบบนำเข้าข้อมูลการวัดยาง.xlsx');
      
      toast({
        title: "ดาวน์โหลดแม่แบบสำเร็จ",
        description: "แม่แบบสำหรับนำเข้าข้อมูลการวัดยางถูกสร้างแล้ว",
      });
    } catch (error) {
      console.error("Error exporting template:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างไฟล์แม่แบบได้",
        variant: "destructive"
      });
    }
  };

  const handleExportMasterData = () => {
    try {
      // สร้างข้อมูลสำหรับส่งออก
      const tiresData = tires.map(tire => ({
        'รหัสยาง (ID)': tire.id,
        'รหัสซีเรียล': tire.serialNumber,
        'ยี่ห้อ': tire.brand,
        'รุ่น': tire.model,
        'ขนาด': tire.size,
        'ประเภท': tire.type === 'new' ? 'ยางใหม่' : 'ยางหล่อดอก',
        'ตำแหน่ง': tire.position || '',
        'รถที่ติดตั้ง': tire.vehicleId ? vehicles.find(v => v.id === tire.vehicleId)?.registrationNumber || '' : '',
        'วันที่ซื้อ': tire.purchaseDate,
        'ความลึกดอกยางล่าสุด': tire.treadDepth,
        'ระยะทางล่าสุด': tire.mileage,
        'สถานะ': tire.status
      }));
      
      const vehiclesData = vehicles.map(vehicle => ({
        'รหัสรถ (ID)': vehicle.id,
        'ทะเบียน': vehicle.registrationNumber,
        'ยี่ห้อ': vehicle.brand,
        'รุ่น': vehicle.model,
        'ประเภท': vehicle.type,
        'จำนวนล้อ': vehicle.wheelPositions,
        'ระยะทางปัจจุบัน': vehicle.currentMileage
      }));
      
      // สร้าง workbook
      const workbook = XLSX.utils.book_new();
      
      // เพิ่ม worksheet สำหรับข้อมูลยาง
      const tiresWorksheet = XLSX.utils.json_to_sheet(tiresData);
      XLSX.utils.book_append_sheet(workbook, tiresWorksheet, 'ข้อมูลยาง');
      
      // เพิ่ม worksheet สำหรับข้อมูลรถ
      const vehiclesWorksheet = XLSX.utils.json_to_sheet(vehiclesData);
      XLSX.utils.book_append_sheet(workbook, vehiclesWorksheet, 'ข้อมูลรถ');
      
      // สร้างไฟล์ Excel และดาวน์โหลด
      XLSX.writeFile(workbook, 'ข้อมูลหลักระบบจัดการยาง.xlsx');
      
      toast({
        title: "ส่งออกข้อมูลสำเร็จ",
        description: "ข้อมูลหลักถูกส่งออกเป็นไฟล์ Excel แล้ว",
      });
    } catch (error) {
      console.error("Error exporting master data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const getTireInfo = (tireId: string) => {
    const tire = tires.find(t => t.id === tireId);
    return tire ? `${tire.serialNumber} (${tire.brand} ${tire.model})` : tireId;
  };
  
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.brand} ${vehicle.model})` : vehicleId;
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          นำเข้าข้อมูลจาก Excel
        </Button>
        
        <Button variant="outline" onClick={handleExportTemplate}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          ดาวน์โหลดแม่แบบ
        </Button>
        
        <Button variant="outline" onClick={handleExportMasterData}>
          <Download className="h-4 w-4 mr-2" />
          ส่งออกข้อมูลหลัก
        </Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>นำเข้าข้อมูลการวัดยางจาก Excel</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="excel-file">เลือกไฟล์ Excel (.xlsx, .xls)</Label>
              <Input 
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                className="mt-2"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                รองรับไฟล์ Excel ที่มีคอลัมน์ข้อมูลยาง ทะเบียนรถ วันที่ และความลึกดอกยาง
              </p>
            </div>
            
            {previewData.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-medium">ตัวอย่างข้อมูลที่จะนำเข้า ({previewData.length} รายการ)</h3>
                  <div className="max-h-[300px] overflow-y-auto mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>วันที่</TableHead>
                          <TableHead>ยาง</TableHead>
                          <TableHead>รถ</TableHead>
                          <TableHead>ความลึกดอกยาง</TableHead>
                          <TableHead>ระยะทาง</TableHead>
                          <TableHead>ตำแหน่ง</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{getTireInfo(item.tireId)}</TableCell>
                            <TableCell>{getVehicleInfo(item.vehicleId)}</TableCell>
                            <TableCell>{item.treadDepth} มม.</TableCell>
                            <TableCell>{item.mileage?.toLocaleString() || '-'}</TableCell>
                            <TableCell>{item.position || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <Button 
                  onClick={handleImport} 
                  disabled={isLoading || previewData.length === 0}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังนำเข้าข้อมูล...
                    </>
                  ) : (
                    'นำเข้าข้อมูลทั้งหมด'
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
