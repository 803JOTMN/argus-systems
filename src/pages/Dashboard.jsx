import { useState, useEffect, useRef } from "react";
import { Camera, Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export default function Dashboard() {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [activities, setActivities] = useState([]);
  const [model, setModel] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [webcamError, setWebcamError] = useState(null);
  const previousObjectsRef = useRef(new Set());
  const lastLogTimeRef = useRef({});
  const missingCountRef = useRef({});
  const bottleEverSeenRef = useRef(false);
  const missingAlertsCountRef = useRef(0);

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

  // Load AI model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log("COCO-SSD model loaded");
      } catch (error) {
        console.error("Failed to load model:", error);
      }
    };
    loadModel();
  }, []);

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera access is not supported in this browser");
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 } 
        });
        console.log("Webcam stream obtained:", mediaStream);
        console.log("Video tracks:", mediaStream.getVideoTracks());
        console.log("First video track settings:", mediaStream.getVideoTracks()[0]?.getSettings());
        setStream(mediaStream);
        setWebcamError(null);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          
          // Wait for video to be ready
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Video load timeout")), 10000);
            
            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              console.log("Video metadata loaded, dimensions:", 
                videoRef.current.videoWidth, videoRef.current.videoHeight);
              console.log("Video element ready state:", videoRef.current.readyState);
              console.log("Video paused:", videoRef.current.paused);
              resolve();
            };
            videoRef.current.onerror = (e) => {
              clearTimeout(timeout);
              console.error("Video error:", e);
              reject(new Error("Video element failed to load"));
            };
          });
          
          // Force play the video
          try {
            await videoRef.current.play();
            console.log("Video playing successfully");
            console.log("After play - paused:", videoRef.current.paused);
            console.log("After play - readyState:", videoRef.current.readyState);
            
            // Extra check - wait a bit and verify video is actually playing
            await new Promise(resolve => setTimeout(resolve, 500));
            if (videoRef.current.paused || videoRef.current.readyState < 2) {
              throw new Error("Video element is not playing properly");
            }
          } catch (playError) {
            console.error("Play error:", playError);
            throw new Error("Could not start video playback: " + playError.message);
          }
        }
      } catch (error) {
        console.error("Failed to access webcam:", error);
        setWebcamError(error.message || "Failed to access camera. Please check permissions.");
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // AI Detection loop
  useEffect(() => {
    if (!model || !videoRef.current || !stream) return;

    let animationId;
    const detect = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const allPredictions = await model.detect(videoRef.current);
        const predictions = allPredictions.filter(p => p.class === 'person' || p.class === 'bottle');
        setDetectedObjects(predictions);

        // Draw bounding boxes
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas && video) {
          const ctx = canvas.getContext("2d");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          predictions.forEach((prediction) => {
            const [x, y, width, height] = prediction.bbox;
            const color = prediction.class === 'person' ? "#ff0000" : "#00ff00";
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = color;
            ctx.font = "16px Arial";
            ctx.fillText(
              `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
              x,
              y > 20 ? y - 5 : y + 20
            );
          });
        }

        // Check for new and missing objects
        const currentObjects = new Set(predictions.map(p => p.class));
        const previousObjects = previousObjectsRef.current;
        const now = Date.now();
        const cooldownMs = 5000; // 5 seconds cooldown between logs
        const requiredMissingFrames = 5; // Must be missing for 5 consecutive frames

        console.log('Detection loop - Current:', Array.from(currentObjects), 'Previous:', Array.from(previousObjects));

        // Track if we've ever seen a bottle
        if (currentObjects.has('bottle')) {
          bottleEverSeenRef.current = true;
        }

        // Check for new objects appearing (log person detections)
        currentObjects.forEach(obj => {
          if (!previousObjects.has(obj) && obj === 'person') {
            console.log('New person detected!');
            const lastLogTime = lastLogTimeRef.current[`detected_${obj}`] || 0;
            if (now - lastLogTime < cooldownMs) {
              console.log('Cooldown active, skipping log');
              return;
            }

            lastLogTimeRef.current[`detected_${obj}`] = now;

            // Capture snapshot
            const snapshotCanvas = document.createElement('canvas');
            snapshotCanvas.width = canvas.width;
            snapshotCanvas.height = canvas.height;
            const snapshotCtx = snapshotCanvas.getContext('2d');
            snapshotCtx.drawImage(video, 0, 0);
            snapshotCtx.drawImage(canvas, 0, 0);
            const snapshot_url = snapshotCanvas.toDataURL('image/jpeg', 0.8);

            const newActivity = {
              id: Date.now().toString(),
              title: `Person detected`,
              description: `A person has been detected in the camera view`,
              type: "detection",
              camera_name: "Main Camera",
              created_date: new Date().toISOString(),
              snapshot_url
            };

            const stored = JSON.parse(localStorage.getItem("activities") || "[]");
            const updated = [newActivity, ...stored].slice(0, 10); // Limit to 10 activities
            localStorage.setItem("activities", JSON.stringify(updated));
            setActivities(updated);
            console.log('Person detection logged!');
          }
        });

        // Check for missing bottle - if we've ever seen it and it's now gone
        if (bottleEverSeenRef.current && !currentObjects.has('bottle')) {
          // Bottle is missing in this frame
          missingCountRef.current['bottle'] = (missingCountRef.current['bottle'] || 0) + 1;
          console.log('Bottle missing count:', missingCountRef.current['bottle']);

          // Only trigger alert if missing for required number of consecutive frames and under limit
          if (missingCountRef.current['bottle'] >= requiredMissingFrames && missingAlertsCountRef.current < 5) {
            const lastLogTime = lastLogTimeRef.current['missing_bottle'] || 0;
            if (now - lastLogTime >= cooldownMs) {
              console.log('Bottle alert triggered!');
              lastLogTimeRef.current['missing_bottle'] = now;
              missingCountRef.current['bottle'] = 0; // Reset counter
              missingAlertsCountRef.current += 1; // Increment alerts count

              // Capture snapshot
              const snapshotCanvas = document.createElement('canvas');
              snapshotCanvas.width = canvas.width;
              snapshotCanvas.height = canvas.height;
              const snapshotCtx = snapshotCanvas.getContext('2d');
              snapshotCtx.drawImage(video, 0, 0);
              snapshotCtx.drawImage(canvas, 0, 0);
              const snapshot_url = snapshotCanvas.toDataURL('image/jpeg', 0.8);

              const newActivity = {
                id: Date.now().toString(),
                title: `Item missing from view`,
                description: `The item is no longer detected in the camera view`,
                type: "alert",
                camera_name: "Main Camera",
                created_date: new Date().toISOString(),
                snapshot_url
              };

              const stored = JSON.parse(localStorage.getItem("activities") || "[]");
              const updated = [newActivity, ...stored].slice(0, 10); // Limit to 10 activities
              localStorage.setItem("activities", JSON.stringify(updated));
              setActivities(updated);

              // Send email notification
              const settings = JSON.parse(localStorage.getItem("settings") || "{}");
              if (settings.notification_email) {
                sendEmailAlert(settings.notification_email, 'bottle', snapshot_url);
              }
            }
          }
        } else if (currentObjects.has('bottle')) {
          // Bottle is present, reset missing counter
          missingCountRef.current['bottle'] = 0;
        }

        previousObjectsRef.current = currentObjects;
      }

      animationId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [model, stream]);

  const sendEmailAlert = async (email, objectName, snapshotUrl) => {
    console.log('Attempting to send email to:', email);
    try {
      const formData = new FormData();
      formData.append('from', 'Argus Systems <postmaster@argus-systems.dev>');
      formData.append('to', email);
      formData.append('subject', `⚠️ Alert: Item Missing from Camera View`);
      formData.append('text', `ALERT: An item has disappeared from the camera view.\n\nDate/Time: ${new Date().toLocaleString()}\n\nSee attached photo for visual confirmation.`);
      
      // Convert base64 to blob and attach
      if (snapshotUrl) {
        const response = await fetch(snapshotUrl);
        const blob = await response.blob();
        formData.append('attachment', blob, `alert_${Date.now()}.jpg`);
      }

      const result = await fetch('https://api.mailgun.net/v3/argus-systems.dev/messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${import.meta.env.VITE_MAILGUN_API_KEY}`)
        },
        body: formData
      });

      if (result.ok) {
        console.log('Email sent successfully!');
      } else {
        const errorText = await result.text();
        console.error('Email send failed:', result.status, errorText);
      }
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Live Camera</h1>
          <p className="text-slate-500 mt-1">Real-time monitoring</p>
        </div>

        {/* Live Camera View */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-semibold text-slate-900">Live Camera Feed</h2>
          </div>
          
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-200 relative">
            {webcamError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-rose-400 p-6 text-center">
                <Camera className="w-16 h-16 mb-4" />
                <p className="text-lg font-semibold mb-2">Camera Error</p>
                <p className="text-sm text-slate-400">{webcamError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                >
                  Retry
                </button>
              </div>
            ) : stream ? (
              <>
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover absolute top-0 left-0"
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-full absolute top-0 left-0"
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-16 h-16 mb-4" />
                <p className="text-lg">Starting webcam...</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {model ? `AI Detection Active - ${detectedObjects.length} objects detected` : "Loading AI model..."}
            </p>
            {detectedObjects.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {detectedObjects.map((obj, idx) => (
                  <Badge key={idx} className="bg-green-100 text-green-700">
                    {obj.class}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No activity yet</p>
              </div>
            ) : (
              activities.slice(0, 5).map((activity) => (
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
                    <img 
                      src={activity.snapshot_url}
                      alt="Activity snapshot"
                      className="w-24 h-16 object-cover rounded border"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}