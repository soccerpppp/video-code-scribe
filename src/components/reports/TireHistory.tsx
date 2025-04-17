
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Calendar, Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface HistoryItem {
  id: string;
  date: string;
  activityType: string;
  description: string;
  vehicle: string;
  vehicleId: string;
  tireSerial: string;
  tireId: string;
  mileage: number;
  cost: number;
  notes?: string;
}

const TireHistory = () => {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [vehicles, setVehicles] = useState<{id: string; name: string}[]>([{ id: "all", name: "รถทั้งหมด" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  
  // ตัวอย่างประเภทกิจกรรมสำหรับฟิลเตอร์
  const activityTypes = [
    { id: "all", name: "กิจกรรมทั้งหมด" },
    { id: "purchase", name: "ซื้อยาง" },
    { id: "repair", name: "ซ่อมยาง" },
    { id: "change", name: "เปลี่ยนยาง" },
    { id: "rotation", name: "หมุนยาง" },
    { id: "measure", name: "วัดความลึกดอกยาง" },
    { id: "retreading", name: "หล่อดอกยาง" },
    { id: "sale", name: "ขายยาง" },
    { id: "installation", name: "ติดตั้งยาง" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all activity logs
      const { data: logs, error: logsError } = await supabase
        .from('activity_logs')
        .select('id, date, activity_type, description, vehicle_id, tire_id, mileage, cost, notes, performed_by, buyer')
        .order('date', { ascending: false });
      
      if (logsError) throw logsError;
      
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, registration_number, brand, model')
        .order('registration_number', { ascending: true });
      
      if (vehiclesError) throw vehiclesError;
      
      // Fetch tires
      const { data: tiresData, error: tiresError } = await supabase
        .from('tires')
        .select('id, serial_number, brand, model, size')
        .order('serial_number', { ascending: true });
      
      if (tiresError) throw tiresError;
      
      // Transform the fetched data
      const formattedVehicles = [
        { id: "all", name: "รถทั้งหมด" },
        ...vehiclesData.map(vehicle => ({
          id: vehicle.id,
          name: `${vehicle.registration_number} (${vehicle.brand})`
        }))
      ];
      
      // Map tires and vehicles to activity logs
      const formattedHistory: HistoryItem[] = logs?.map(log => {
        const tire = tiresData.find(t => t.id === log.tire_id);
        const vehicle = vehiclesData.find(v => v.id === log.vehicle_id);
        
        return {
          id: log.id,
          date: log.date,
          activityType: log.activity_type,
          description: log.description || getDefaultDescription(log.activity_type),
          vehicle: vehicle ? vehicle.registration_number : '-',
          vehicleId: log.vehicle_id || '',
          tireSerial: tire ? tire.serial_number : '-',
          tireId: log.tire_id,
          mileage: log.mileage || 0,
          cost: log.cost || 0,
          notes: log.notes || (log.buyer ? `ผู้ซื้อ: ${log.buyer}` : '') || (log.performed_by ? `ผู้ดำเนินการ: ${log.performed_by}` : '')
        };
      }) || [];
      
      setHistoryData(formattedHistory);
      setVehicles(formattedVehicles);
      
    } catch (error: any) {
      console.error("Error fetching history data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลประวัติได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // สร้างคำอธิบายเริ่มต้นสำหรับกิจกรรมแต่ละประเภท
  const getDefaultDescription = (activityType: string) => {
    switch (activityType) {
      case 'purchase': return 'ซื้อยางใหม่';
      case 'repair': return 'ซ่อมยาง';
      case 'change': return 'เปลี่ยนยาง';
      case 'rotation': return 'หมุนยาง';
      case 'measure': return 'วัดความลึกดอกยาง';
      case 'retreading': return 'หล่อดอกยาง';
      case 'sale': return 'ขายยาง';
      case 'installation': return 'ติดตั้งยาง';
      default: return activityType;
    }
  };

  // ฟังก์ชันสำหรับแสดงสีของป้ายกำกับกิจกรรม
  const getActivityBadgeColor = (activityType: string) => {
    switch (activityType) {
      case 'purchase': return 'bg-green-500';
      case 'repair': return 'bg-yellow-500';
      case 'change': return 'bg-blue-500';
      case 'rotation': return 'bg-purple-500';
      case 'measure': return 'bg-gray-500';
      case 'retreading': return 'bg-cyan-500';
      case 'sale': return 'bg-red-500';
      case 'installation': return 'bg-indigo-500';
      default: return 'bg-gray-300';
    }
  };

  // ฟังก์ชันสำหรับแสดงชื่อกิจกรรม
  const getActivityName = (activityType: string) => {
    switch (activityType) {
      case 'purchase': return 'ซื้อยาง';
      case 'repair': return 'ซ่อมยาง';
      case 'change': return 'เปลี่ยนยาง';
      case 'rotation': return 'หมุนยาง';
      case 'measure': return 'วัดความลึก';
      case 'retreading': return 'หล่อดอกยาง';
      case 'sale': return 'ขายยาง';
      case 'installation': return 'ติดตั้งยาง';
      default: return activityType;
    }
  };

  // กรองข้อมูลตามการค้นหาและตัวกรอง
  const filteredHistory = historyData.filter(item => {
    // กรองตามคำค้นหา
    const matchesSearch = 
      item.tireSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // กรองตามรถ
    const matchesVehicle = filterVehicle === 'all' || item.vehicleId === filterVehicle;
    
    // กรองตามประเภทกิจกรรม
    const matchesActivity = filterActivity === 'all' || item.activityType === filterActivity;
    
    return matchesSearch && matchesVehicle && matchesActivity;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <div className="flex items-center border border-input rounded-md pl-3">
            <FileSearch className="h-4 w-4 text-muted-foreground" />
            <Input
              className="border-0"
              placeholder="ค้นหาตามซีเรียลหรือคำอธิบาย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-1/4">
          <div className="flex items-center">
            <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
            <Select 
              value={filterVehicle} 
              onValueChange={setFilterVehicle}
            >
              <SelectTrigger>
                <SelectValue placeholder="รถทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="w-full md:w-1/4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <Select 
              value={filterActivity} 
              onValueChange={setFilterActivity}
            >
              <SelectTrigger>
                <SelectValue placeholder="กิจกรรมทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(activity => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติการใช้งานยาง</CardTitle>
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
                  <TableHead>วันที่</TableHead>
                  <TableHead>ซีเรียลยาง</TableHead>
                  <TableHead>รถ</TableHead>
                  <TableHead>กิจกรรม</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>เลขไมล์</TableHead>
                  <TableHead>ค่าใช้จ่าย</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>{item.tireSerial}</TableCell>
                      <TableCell>{item.vehicle}</TableCell>
                      <TableCell>
                        <Badge className={getActivityBadgeColor(item.activityType)}>
                          {getActivityName(item.activityType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.mileage?.toLocaleString()} กม.</TableCell>
                      <TableCell>{item.cost?.toLocaleString()} บาท</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={item.notes}>
                          {item.notes}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
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

export default TireHistory;
