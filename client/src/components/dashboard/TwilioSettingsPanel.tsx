import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { MessageSquareText, Save, Loader2, Key, Phone, UserCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlossCard } from "@/components/shared/GlossCard";
import { cn } from "@/lib/utils";

export function TwilioSettingsPanel() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  });
  const [success, setSuccess] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings", "twilio_config"],
    queryFn: () => api.admin.getSettings("twilio_config"),
  });

  useEffect(() => {
    if (settings?.config) {
      setFormData({
        accountSid: settings.config.accountSid || "",
        authToken: settings.config.authToken || "",
        phoneNumber: settings.config.phoneNumber || "",
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (config: typeof formData) => 
      api.admin.updateSettings("twilio_config", config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "twilio_config"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <MessageSquareText className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Twilio SMS Engine</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Communication Infrastructure
          </p>
        </div>
      </div>

      <GlossCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Account SID */}
            <div className="space-y-2">
              <Label htmlFor="accountSid" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                Account SID
              </Label>
              <Input
                id="accountSid"
                value={formData.accountSid}
                onChange={(e) => setFormData({ ...formData, accountSid: e.target.value })}
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="bg-black/20 font-mono text-sm"
              />
            </div>

            {/* Auth Token */}
            <div className="space-y-2">
              <Label htmlFor="authToken" className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                Auth Token
              </Label>
              <Input
                id="authToken"
                type="password"
                value={formData.authToken}
                onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                placeholder="••••••••••••••••••••••••••••••••"
                className="bg-black/20 font-mono text-sm"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Twilio Phone Number
              </Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+18885550000"
                className="bg-black/20 font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Ensure the number includes the country code (e.g., +1)
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {settings?.updatedAt && (
                <span>Last updated: {new Date(settings.updatedAt).toLocaleString()}</span>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className={cn(
                "min-w-[140px] transition-all duration-300",
                success ? "bg-emerald-600 hover:bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </GlossCard>

      {/* Info Card */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-400">
        <p className="font-bold mb-1">💡 Important Note</p>
        <p className="text-xs opacity-80 leading-relaxed">
          The server will prioritize these UI-managed settings over any values found in the .env file. 
          Updating these settings will take effect for the next SMS dispatch.
        </p>
      </div>
    </div>
  );
}
