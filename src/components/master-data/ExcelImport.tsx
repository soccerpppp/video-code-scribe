
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { read, utils } from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Supplier, Vehicle, Tire } from "@/types/models";

interface ExcelImportProps {
  type: 'suppliers' | 'vehicles' | 'tires';
  onImportSuccess: () => void;
}

const ExcelImport = ({ type, onImportSuccess }: ExcelImportProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    setIsLoading(true);
    const file = event.target.files[0];
    
    try {
      // อ่านไฟล์ Excel
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      // ตรวจสอบและแปลงข้อมูลตามประเภท
      switch (type) {
        case 'suppliers':
          await importSuppliers(jsonData as Partial<Supplier>[]);
          break;
        case 'vehicles':
          await importVehicles(jsonData as Partial<Vehicle>[]);
          break;
        case 'tires':
          await importTires(jsonData as Partial<Tire>[]);
          break;
      }

      toast({
        title: "นำเข้าข้อมูลสำเร็จ",
        description: `นำเข้าข้อมูล ${type} จาก Excel เรียบร้อยแล้ว`,
      });
      
      onImportSuccess();
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถนำเข้าข้อมูลได้ กรุณาตรวจสอบรูปแบบไฟล์",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // รีเซ็ต input file
      event.target.value = '';
    }
  };

  const importSuppliers = async (data: Partial<Supplier>[]) => {
    const { error } = await supabase
      .from('suppliers')
      .insert(data.map(supplier => ({
        name: supplier.name,
        contact_person: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        notes: supplier.notes
      })));

    if (error) throw error;
  };

  const importVehicles = async (data: Partial<Vehicle>[]) => {
    const { error } = await supabase
      .from('vehicles')
      .insert(data.map(vehicle => ({
        registration_number: vehicle.registrationNumber,
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        wheel_positions: vehicle.wheelPositions,
        current_mileage: vehicle.currentMileage,
        notes: vehicle.notes
      })));

    if (error) throw error;
  };

  const importTires = async (data: Partial<Tire>[]) => {
    const { error } = await supabase
      .from('tires')
      .insert(data.map(tire => ({
        serial_number: tire.serialNumber,
        brand: tire.brand,
        model: tire.model,
        size: tire.size,
        type: tire.type,
        position: tire.position,
        vehicle_id: tire.vehicleId,
        purchase_date: tire.purchaseDate,
        purchase_price: tire.purchasePrice,
        supplier: tire.supplier,
        status: tire.status,
        tread_depth: tire.treadDepth,
        mileage: tire.mileage,
        notes: tire.notes
      })));

    if (error) throw error;
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
        id={`excel-import-${type}`}
        disabled={isLoading}
      />
      <Button
        variant="outline"
        disabled={isLoading}
        onClick={() => document.getElementById(`excel-import-${type}`)?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        นำเข้าจาก Excel
      </Button>
    </div>
  );
};

export default ExcelImport;
