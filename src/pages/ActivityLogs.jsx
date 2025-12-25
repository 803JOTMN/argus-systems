import { useState, useEffect } from "react";
import { Activity, Camera, Clock, Download, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function ActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("activities");
    if (stored) {
      setActivities(JSON.parse(stored));
    }
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
    link.download = `snapshot_${activity.id}_${format(new Date(activity.created_date), "yyyy-MM-dd_HH-mm-ss")}.jpg`;
    link.click();
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-slate-500 mt-1">All camera activity and alerts</p>
        </div>

        <Card className="p-6">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No activity yet</p>
              </div>
            ) : (
              activities.map((activity) => (
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
                        {format(new Date(activity.created_date), "MMM d, HH:mm:ss")}
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
                    {format(new Date(selectedSnapshot.created_date), "MMM d, yyyy HH:mm:ss")}
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
  );
}