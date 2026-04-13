import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  UserPlus, 
  Trash2, 
  UserCheck, 
  UserMinus, 
  Shield, 
  User as UserIcon,
  Users,
  Loader2,
  Key,
  Eye,
  Pencil,
  AlertTriangle,
  Calendar,
  Clock,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { CreateStaffSchema, UpdateStaffSchema, type CreateStaffForm, type UpdateStaffForm } from "@vcc/shared";
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
import { AnimatedError } from "@/components/shared/AnimatedError";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Staff = {
  id: string;
  username: string;
  fullName: string;
  role: "superadmin" | "admin" | "agent";
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
};

export function StaffManagementPanel() {
  const queryClient = useQueryClient();
  
  // ── Modal States ───────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewStaff, setViewStaff] = useState<Staff | null>(null);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [confirmDelete, setConfirmStaffDelete] = useState<Staff | null>(null);
  const [confirmStatus, setConfirmStaffStatus] = useState<Staff | null>(null);
  
  const [errorMessage, setErrorMessage] = useState("");

  // ── Forms ──────────────────────────────────────────────────────────────────
  const createForm = useForm<CreateStaffForm>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: { role: "agent" },
  });

  const editForm = useForm<UpdateStaffForm>({
    resolver: zodResolver(UpdateStaffSchema),
  });

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: staffList, isLoading } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => api.admin.listStaff() as Promise<Staff[]>,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body: CreateStaffForm) => api.admin.createStaff(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setIsAddModalOpen(false);
      createForm.reset();
      setErrorMessage("");
    },
    onError: (err: any) => setErrorMessage(err.message || "Failed to create staff member"),
  });

  const updateMutation = useMutation({
    mutationFn: (body: UpdateStaffForm) => editStaff ? api.admin.updateStaff(editStaff.id, body) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setEditStaff(null);
      editForm.reset();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      api.admin.updateStaff(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setConfirmStaffStatus(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setConfirmStaffDelete(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const onEditClick = (staff: Staff) => {
    setEditStaff(staff);
    editForm.reset({
      fullName: staff.fullName,
      role: staff.role as any,
      isActive: staff.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Users className="h-6 w-6 text-amber-400" />
            Core Directory
          </h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {staffList?.length ?? 0} System Identities Active
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-xl shadow-amber-500/20 btn-gradient h-11 px-6">
          <UserPlus className="h-4 w-4" /> Provision New Identity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList?.map((staff) => (
          <GlossCard key={staff.id} className="relative group border-white/5 hover:border-amber-500/30 transition-all duration-500 overflow-hidden">
            {/* Role Watermark */}
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 pointer-events-none">
              <Shield className="h-32 w-32 rotate-12" />
            </div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                  staff.role === 'superadmin' ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-muted-foreground"
                )}>
                  {staff.role === 'superadmin' ? <Shield className="h-7 w-7" /> : <UserIcon className="h-7 w-7" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-tight leading-tight mb-1">{staff.fullName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono bg-white/5 px-1.5 py-0.5 rounded">@{staff.username}</span>
                    <Badge variant={staff.isActive ? "outline" : "destructive"} className={cn(
                      "h-4 text-[9px] uppercase tracking-tighter",
                      staff.isActive && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}>
                      {staff.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-5 border-t border-white/5 relative z-10">
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewStaff(staff)}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEditClick(staff)}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                {staff.role !== 'superadmin' && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setConfirmStaffStatus(staff)}
                      className={cn(
                        "h-9 w-9 rounded-xl transition-colors",
                        staff.isActive 
                          ? "text-muted-foreground hover:text-orange-400 hover:bg-orange-400/10" 
                          : "text-emerald-400 hover:bg-emerald-400/10"
                      )}
                    >
                      {staff.isActive ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setConfirmStaffDelete(staff)}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10"
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

      {/* ── Modal: PROVISION NEW IDENTITY ────────────────────────────────────── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-stone-950/95 backdrop-blur-2xl border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black gradient-text">System Provisioning</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold opacity-60">Initialize new staff credentials</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-5 pt-6" noValidate>
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-in shake-2">
                {errorMessage}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                <Input {...createForm.register("fullName")} placeholder="First Last" className="bg-white/5 border-white/10" />
                <AnimatedError message={createForm.formState.errors.fullName?.message} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                <Input {...createForm.register("username")} placeholder="id_tag" className="bg-white/5 border-white/10" />
                <AnimatedError message={createForm.formState.errors.username?.message} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Key (Password)</Label>
              <Input {...createForm.register("password")} type="password" placeholder="••••••••" className="bg-white/5 border-white/10" />
              <AnimatedError message={createForm.formState.errors.password?.message} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assigned Role</Label>
              <Select value={createForm.watch("role")} onValueChange={(v: any) => createForm.setValue("role", v, { shouldValidate: true })}>
                <SelectTrigger className="bg-white/5 border-white/10 h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-stone-900 border-white/10">
                  <SelectItem value="agent">Agent (Standard)</SelectItem>
                  <SelectItem value="admin">Admin (System Control)</SelectItem>
                </SelectContent>
              </Select>
              <AnimatedError message={createForm.formState.errors.role?.message} />
            </div>

            <DialogFooter className="pt-6">
              <Button type="submit" className="w-full btn-gradient h-12 text-black font-bold shadow-xl shadow-amber-500/20" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Provisioning"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: VIEW IDENTITY ─────────────────────────────────────────────── */}
      <Dialog open={!!viewStaff} onOpenChange={() => setViewStaff(null)}>
        <DialogContent className="sm:max-w-[400px] bg-stone-950/95 backdrop-blur-2xl border-white/10 p-0 overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-amber-500 to-orange-600 relative">
            <div className="absolute -bottom-10 left-8">
              <div className="h-20 w-20 rounded-2xl bg-stone-950 border-4 border-stone-950 flex items-center justify-center shadow-2xl">
                {viewStaff?.role === 'superadmin' ? <Shield className="h-10 w-10 text-amber-400" /> : <UserIcon className="h-10 w-10 text-muted-foreground" />}
              </div>
            </div>
          </div>
          <div className="px-8 pt-14 pb-8 space-y-6">
            <div>
              <h3 className="text-2xl font-black text-white leading-tight">{viewStaff?.fullName}</h3>
              <p className="text-amber-400 font-mono text-sm font-bold tracking-tight">@{viewStaff?.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[9px] uppercase font-black text-muted-foreground mb-1 tracking-tighter">Current Status</p>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", viewStaff?.isActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-rose-500")} />
                  <span className="text-xs font-bold text-white">{viewStaff?.isActive ? "Operational" : "Offline"}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[9px] uppercase font-black text-muted-foreground mb-1 tracking-tighter">System Tier</p>
                <span className="text-xs font-bold text-white capitalize">{viewStaff?.role}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Registered: {viewStaff ? new Date(viewStaff.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs truncate">Last Active: {viewStaff?.lastLogin ? new Date(viewStaff.lastLogin).toLocaleString() : 'Never'}</span>
              </div>
            </div>

            <Button onClick={() => setViewStaff(null)} variant="outline" className="w-full border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] h-10">Close Record</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: EDIT IDENTITY ─────────────────────────────────────────────── */}
      <Dialog open={!!editStaff} onOpenChange={() => setEditStaff(null)}>
        <DialogContent className="sm:max-w-[450px] bg-stone-950/95 backdrop-blur-2xl border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black gradient-text">Modify Identity</DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Updating record for @{editStaff?.username}</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
              <Input {...editForm.register("fullName")} className="bg-white/5 border-white/10 h-11" />
              <AnimatedError message={editForm.formState.errors.fullName?.message} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tier Revision</Label>
              <Select value={editForm.watch("role")} onValueChange={(v: any) => editForm.setValue("role", v, { shouldValidate: true })}>
                <SelectTrigger className="bg-white/5 border-white/10 h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-stone-900 border-white/10">
                  <SelectItem value="agent">Agent (Standard)</SelectItem>
                  <SelectItem value="admin">Admin (System Control)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Override Security Key</Label>
              <Input {...editForm.register("password")} type="password" placeholder="Leave empty to retain current" className="bg-white/5 border-white/10 h-11" />
              <AnimatedError message={editForm.formState.errors.password?.message} />
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={() => setEditStaff(null)} className="flex-1 border border-white/5 hover:bg-white/5">Cancel</Button>
              <Button type="submit" className="flex-[2] btn-gradient h-11 font-bold text-black shadow-lg shadow-amber-500/20" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: CONFIRM STATUS TOGGLE ────────────────────────────────────── */}
      <Dialog open={!!confirmStatus} onOpenChange={() => setConfirmStaffStatus(null)}>
        <DialogContent className="sm:max-w-[400px] bg-stone-950 border-orange-500/20 shadow-2xl">
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Security Override</h3>
            <p className="text-sm text-muted-foreground px-4 leading-relaxed">
              Are you certain you want to <span className="text-white font-bold">{confirmStatus?.isActive ? "deactivate" : "reactivate"}</span> access for <span className="text-orange-400 font-bold">@{confirmStatus?.username}</span>?
            </p>
            <div className="grid grid-cols-2 gap-3 w-full mt-10">
              <Button variant="outline" onClick={() => setConfirmStaffStatus(null)} className="border-white/10 hover:bg-white/5">Abort</Button>
              <Button 
                onClick={() => confirmStatus && statusMutation.mutate({ id: confirmStatus.id, isActive: !confirmStatus.isActive })}
                className={cn(
                  "font-bold text-black",
                  confirmStatus?.isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-500 hover:bg-emerald-600"
                )}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? "Processing..." : `Confirm ${confirmStatus?.isActive ? "Deactivation" : "Reactivation"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: CONFIRM DELETION ─────────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmStaffDelete(null)}>
        <DialogContent className="sm:max-w-[400px] bg-stone-950 border-rose-500/20 shadow-2xl">
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Purge Identity</h3>
            <p className="text-sm text-muted-foreground px-4 leading-relaxed">
              This action will <span className="text-rose-400 font-bold">permanently soft-delete</span> all system links for <span className="text-white font-bold">{confirmDelete?.fullName}</span>. This cannot be undone easily.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full mt-10">
              <Button variant="outline" onClick={() => setConfirmStaffDelete(null)} className="border-white/10 hover:bg-white/5">Abort</Button>
              <Button 
                variant="destructive"
                onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
                className="font-bold shadow-lg shadow-rose-500/20"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Purging..." : "Confirm Purge"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
