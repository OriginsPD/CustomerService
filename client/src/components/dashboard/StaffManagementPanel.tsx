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
} from "lucide-react";
import { api } from "@/lib/api";
import { CreateStaffSchema, type CreateStaffForm } from "@vcc/shared";
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
  DialogTrigger,
} from "@/components/ui/dialog";

export function StaffManagementPanel() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateStaffForm>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: { role: "agent" },
  });

  const roleValue = watch("role");

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => api.admin.listStaff(),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateStaffForm) => api.admin.createStaff(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setIsAddModalOpen(false);
      reset();
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

  const onSubmit = (data: CreateStaffForm) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-400" />
          System Staff ({staffList?.length ?? 0})
        </h2>
        
        <Dialog open={isAddModalOpen} onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setErrorMessage("");
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-amber-500/20 btn-gradient">
              <UserPlus className="h-4 w-4" /> Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-xl border-white/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black gradient-text">Create Staff Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4" noValidate>
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-in shake-2">
                  {errorMessage}
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-400 transition-colors" />
                  <Input 
                    {...register("fullName")}
                    placeholder="Jane Doe"
                    className={cn(
                      "bg-white/5 border-white/10 pl-10 h-11 focus:ring-amber-500/20",
                      errors.fullName && "border-rose-500/50"
                    )}
                  />
                </div>
                <AnimatedError message={errors.fullName?.message} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                <div className="relative group">
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-muted-foreground group-focus-within:text-amber-400 transition-colors">@</span>
                  <Input 
                    {...register("username")}
                    placeholder="jdoe"
                    className={cn(
                      "bg-white/5 border-white/10 pl-10 h-11 focus:ring-amber-500/20",
                      errors.username && "border-rose-500/50"
                    )}
                  />
                </div>
                <AnimatedError message={errors.username?.message} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Security Key</Label>
                <div className="relative group">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-400 transition-colors" />
                  <Input 
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "bg-white/5 border-white/10 pl-10 h-11 focus:ring-amber-500/20",
                      errors.password && "border-rose-500/50"
                    )}
                  />
                </div>
                <AnimatedError message={errors.password?.message} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">System Role</Label>
                <Select 
                  value={roleValue} 
                  onValueChange={(val: any) => setValue("role", val, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn(
                    "bg-white/5 border-white/10 h-11 focus:ring-amber-500/20",
                    errors.role && "border-rose-500/50"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-900 border-white/10">
                    <SelectItem value="agent" className="focus:bg-amber-500/10 focus:text-amber-400">Agent (Queue Control)</SelectItem>
                    <SelectItem value="admin" className="focus:bg-amber-500/10 focus:text-amber-400">Admin (Analytics + Questions)</SelectItem>
                  </SelectContent>
                </Select>
                <AnimatedError message={errors.role?.message} />
              </div>

              <Button type="submit" className="w-full btn-gradient h-11 shadow-lg shadow-amber-500/20 mt-4" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Initialize Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList?.map((staff: any) => (
          <GlossCard key={staff.id} className="relative group border-white/5 hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-300">
                  {staff.role === 'superadmin' ? <Shield className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{staff.fullName}</h3>
                  <p className="text-xs text-muted-foreground font-mono">@{staff.username}</p>
                </div>
              </div>
              <Badge variant={staff.isActive ? "outline" : "destructive"} className={cn(
                "capitalize text-[10px] font-bold tracking-widest",
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
                      className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/5"
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
