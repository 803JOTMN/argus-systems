import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Mail, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

export default function Settings() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    setEmail(settings.notification_email || "803jotmn@psba.edu.sg");
  }, []);

  const handleSave = () => {
    const settings = { notification_email: email };
    localStorage.setItem("settings", JSON.stringify(settings));
    
    // Log activity
    const newActivity = {
      id: Date.now().toString(),
      title: "Settings saved",
      description: `Notification email updated to ${email}`,
      type: "system",
      created_date: new Date().toISOString()
    };
    const stored = JSON.parse(localStorage.getItem("activities") || "[]");
    const updated = [newActivity, ...stored].slice(0, 10);
    localStorage.setItem("activities", JSON.stringify(updated));
    
    toast.success("Settings saved successfully");
  };

  const handleTestEmail = async () => {
    console.log("Test email button clicked");
    console.log("API Key available:", !!import.meta.env.VITE_MAILGUN_API_KEY);
    console.log("API Key value:", import.meta.env.VITE_MAILGUN_API_KEY ? "SET" : "UNDEFINED");
    const loadingToast = toast.loading("Sending test email...");

    try {
      const apiKey = import.meta.env.VITE_MAILGUN_API_KEY;
      
      if (!apiKey) {
        toast.dismiss(loadingToast);
        toast.error("Mailgun API key not configured. Check your environment variables.");
        console.error("VITE_MAILGUN_API_KEY is not set");
        return;
      }

      const formData = new FormData();
      formData.append('from', 'Argus Systems <postmaster@argus-systems.dev>');
      formData.append('to', email);
      formData.append('subject', '📧 Test Email from Argus Systems');
      formData.append('text', `This is a test email from Argus Systems.\n\nTime: ${new Date().toLocaleString()}\n\nIf you received this email, your notification settings are working correctly!`);

      console.log("Sending email to:", email);
      const response = await fetch('https://api.mailgun.net/v3/argus-systems.dev/messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${apiKey}`)
        },
        body: formData
      });
      
      console.log("Response status:", response.status);
      
      toast.dismiss(loadingToast);

      if (response.ok) {
        // Log activity
        const newActivity = {
          id: Date.now().toString(),
          title: "Test email sent",
          description: `Test email sent to ${email}`,
          type: "system",
          created_date: new Date().toISOString()
        };
        const stored = JSON.parse(localStorage.getItem("activities") || "[]");
        const updated = [newActivity, ...stored].slice(0, 10);
        localStorage.setItem("activities", JSON.stringify(updated));

        toast.success("Test email sent successfully!");
        console.log("Email sent to:", email);
      } else {
        const error = await response.text();
        console.error('Email error:', error);
        
        // Parse error message
        let errorMessage = "Failed to send test email";
        try {
          const errorJson = JSON.parse(error);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          // If not JSON, use the text directly
          if (error.includes("authorized")) {
            errorMessage = "Email not authorized. Add your email as an authorized recipient in Mailgun dashboard.";
          }
        }
        
        toast.error(errorMessage, { duration: 6000 });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error sending test email: " + error.message);
      console.error('Error:', error);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your notification preferences</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address for Alerts
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleSave}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                You'll receive an email notification whenever an item goes missing from the camera view
              </p>

              </div>

              <div className="pt-4 border-t">
              <Button 
                onClick={handleTestEmail}
                variant="outline"
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Test Email
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </>
  );
}