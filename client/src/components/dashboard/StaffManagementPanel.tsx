import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  UserPlus, 
  Trash2, 
  UserCheck, 
  UserMinus, 
  Shield, 
  User as UserIcon,
  Users,
  Loader2,
  MoreVertical,
  Pencil
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlossCard } from "@/components/shared/GlossCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StaffManagementPanel() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    password: "",
    role: "agent" as "admin" | "agent",
  });

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => api.admin.listStaff(),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof formData) => api.admin.createStaff(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setIsAddModalOpen(false);
      setFormData({ username: "", fullName: "", password: "", role: "agent" });
      setErrorMessage("");
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Failed to create staff member");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      api.admin.updateStaff(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteStaff(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400" />
          System Staff ({staffList?.length ?? 0})
        </h2>
        
        <Dialog open={isAddModalOpen} onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setErrorMessage("");
            setFormData({ username: "", fullName: "", password: "", role: "agent" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-indigo-500/20">
              <UserPlus className="h-4 w-4" /> Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Staff Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  {errorMessage}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Jane Doe"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="jdoe"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>System Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent (Queue Control)</SelectItem>
                    <SelectItem value="admin">Admin (Analytics + Questions)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList?.map((staff: any) => (
          <GlossCard key={staff.id} className="relative group border-white/5 hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                  {staff.role === 'superadmin' ? <Shield className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{staff.fullName}</h3>
                  <p className="text-xs text-muted-foreground font-mono">@{staff.username}</p>
                </div>
              </div>
              <Badge variant={staff.isActive ? "outline" : "destructive"} className={cn(
                "capitalize",
                staff.isActive && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}>
                {staff.role}
              </Badge>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Status</span>
                <span className={cn("text-xs font-semibold", staff.isActive ? "text-emerald-400" : "text-rose-400")}>
                  {staff.isActive ? "Active Account" : "Deactivated"}
                </span>
              </div>
              
              <div className="flex gap-2">
                {staff.role !== 'superadmin' && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => statusMutation.mutate({ id: staff.id, isActive: !staff.isActive })}
                      title={staff.isActive ? "Deactivate" : "Activate"}
                      className="h-8 w-8 text-muted-foreground hover:text-white"
                    >
                      {staff.isActive ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { if(confirm('Are you sure?')) deleteMutation.mutate(staff.id) }}
                      className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </GlossCard>
        ))}
      </div>
    </div>
  );
}
