import { useState, useEffect } from "react";
import { Activity, Camera, Clock, Download, X, Search, Filter, FileDown, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { toast, Toaster } from "sonner";
import { supabase } from "@/components/supabaseClient";

export default function ActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState(["detection", "alert", "system"]);

  useEffect(() => {
    const fetchDetections = async () => {
      const { data, error } = await supabase
        .from('detections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setActivities(data);
      }
    };
    
    fetchDetections();
  }, []);

  const typeColors = {
    detection: "bg-blue-100 text-blue-700",
    alert: "bg-rose-100 text-rose-700",
    system: "bg-slate-100 text-slate-700"
  };

  const downloadSnapshot = (activity) => {
    if (!activity.snapshot_url) return;
    
    const link = document.createElement('a');
    link.href = activity.snapshot_url;
    link.download = `snapshot_${activity.id}_${format(new Date(activity.created_at), "yyyy-MM-dd_HH-mm-ss")}.jpg`;
    link.click();
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const exportToPDF = async () => {
    const loadingToast = toast.loading("Generating PDF report...");
    
    try {
      const pdf = new jsPDF();
      let yPosition = 20;
      
      // Title
      pdf.setFontSize(20);
      pdf.text("Activity Logs Report", 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Generated: ${format(new Date(), "MMM d, yyyy HH:mm:ss")}`, 20, yPosition);
      yPosition += 15;
      
      for (let i = 0; i < filteredActivities.length; i++) {
        const activity = filteredActivities[i];
        
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Activity details
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text(activity.title, 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Type: ${activity.type} | Camera: ${activity.camera_name || 'N/A'}`, 20, yPosition);
        yPosition += 5;
        pdf.text(`Time: ${format(new Date(activity.created_at), "MMM d, yyyy HH:mm:ss")}`, 20, yPosition);
        yPosition += 5;
        
        if (activity.description) {
          pdf.text(activity.description, 20, yPosition);
          yPosition += 7;
        }
        
        // Add photo if available
        if (activity.snapshot_url) {
          try {
            const imgWidth = 80;
            const imgHeight = 50;
            
            if (yPosition + imgHeight > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            
            pdf.addImage(activity.snapshot_url, 'JPEG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
          } catch (error) {
            console.error("Error adding image:", error);
            yPosition += 5;
          }
        }
        
        // Separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPosition, 190, yPosition);
        yPosition += 10;
      }
      
      pdf.save(`activity_logs_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.pdf`);
      toast.dismiss(loadingToast);
      toast.success("PDF report generated successfully!");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF");
      console.error("PDF generation error:", error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypes.includes(activity.type);
    return matchesSearch && matchesType;
  });

  return (
    <>
      <Toaster position="top-center" />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-slate-500 mt-1">All camera activity and alerts</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger>
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2">
                <Filter className="w-4 h-4 mr-2" />
                Filter ({selectedTypes.length})
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Filter by Type</h4>
                {['detection', 'alert', 'system'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={type}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <label
                      htmlFor={type}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            onClick={exportToPDF}
            variant="outline"
            disabled={filteredActivities.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <Card className="p-6">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No activity yet</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No activities match your search</p>
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900">{activity.title}</h3>
                      <Badge className={typeColors[activity.type]}>
                        {activity.type}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-slate-600 mb-2">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {activity.camera_name && (
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {activity.camera_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(activity.created_at), "MMM d, HH:mm:ss")}
                      </span>
                    </div>
                  </div>
                  {activity.snapshot_url && (
                    <div className="flex flex-col gap-2">
                      <img 
                        src={activity.snapshot_url}
                        alt="Activity snapshot"
                        className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedSnapshot(activity)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSnapshot(activity)}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {selectedSnapshot && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">{selectedSnapshot.title}</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedSnapshot(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <img 
                src={selectedSnapshot.snapshot_url}
                alt="Full snapshot"
                className="w-full rounded-lg border"
              />
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {selectedSnapshot.camera_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(selectedSnapshot.created_at), "MMM d, yyyy HH:mm:ss")}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => downloadSnapshot(selectedSnapshot)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}