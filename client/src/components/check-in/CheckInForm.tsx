import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Loader2, UserPlus, ArrowRight, ArrowLeft, CheckCircle2, User, Mail, Building2, Phone, Briefcase } from "lucide-react";
import { CheckInFormSchema, purposeOptions, type CheckInForm, type CheckInResponse } from "@vcc/shared";
import { useCheckIn } from "@/hooks/useCheckIn";
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
import { ConfirmationModal } from "./ConfirmationModal";
import { GlossCard } from "@/components/shared/GlossCard";
import { AnimatedError } from "@/components/shared/AnimatedError";
import { cn } from "@/lib/utils";

type Step = 1 | 2;

export function CheckInForm() {
  const [step, setStep] = useState<Step>(1);
  const [confirmData, setConfirmData] = useState<CheckInResponse | null>(null);
  const checkIn = useCheckIn();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CheckInForm>({
    resolver: zodResolver(CheckInFormSchema),
    defaultValues: { phone: "", company: "" },
  });

  const purposeValue = watch("purpose");
  const isCustomPurpose = !purposeOptions.slice(0, -1).includes(purposeValue as any);

  const nextStep = async () => {
    const isValid = await trigger(["name", "email"]);
    if (isValid) setStep(2);
  };

  const onSubmit = async (data: CheckInForm) => {
    try {
      const result = await checkIn.mutateAsync(data);
      setConfirmData(result);
    } catch (err) {
      console.error("Check-in failed:", err);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <>
      <GlossCard className="max-w-xl mx-auto overflow-hidden">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-gold-500 shadow-lg shadow-amber-500/20">
                <UserPlus className="h-5 w-5 text-black" />
              </div>
              <div>
                <h2 className="text-xl font-black gradient-text">Check-In</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Step {step} of 2
                </p>
              </div>
            </div>
            
            <div className="flex gap-1.5">
              {[1, 2].map((s) => (
                <div 
                  key={s} 
                  className={cn(
                    "h-1.5 w-8 rounded-full transition-all duration-500",
                    step >= s ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" : "bg-white/10"
                  )} 
                />
              ))}
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-amber-500/30 via-transparent to-transparent" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative min-h-[340px]">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3 text-amber-400" /> Full Name
                    </Label>
                    <Input
                      {...register("name")}
                      placeholder="Enter your name"
                      className={cn(
                        "bg-white/5 border-white/10 focus:border-amber-500/50 transition-all",
                        errors.name && "border-rose-500/50 focus:border-rose-500/50"
                      )}
                    />
                    <AnimatedError message={errors.name?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3 text-amber-400" /> Email Address
                    </Label>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="your@email.com"
                      className={cn(
                        "bg-white/5 border-white/10 focus:border-amber-500/50 transition-all",
                        errors.email && "border-rose-500/50 focus:border-rose-500/50"
                      )}
                    />
                    <AnimatedError message={errors.email?.message} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-amber-400" /> Company
                      </Label>
                      <Input 
                        {...register("company")} 
                        placeholder="Organization"
                        className="bg-white/5 border-white/10 focus:border-amber-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3 text-amber-400" /> Phone
                      </Label>
                      <Input
                        {...register("phone")}
                        type="tel"
                        placeholder="+1 (---) --- ----"
                        className="bg-white/5 border-white/10 focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="button" onClick={nextStep} className="w-full btn-gradient group">
                    Next Step <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-5"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-3 w-3 text-amber-400" /> Purpose of Visit
                    </Label>
                    <Select
                      value={isCustomPurpose && purposeValue !== "" ? "Other" : purposeValue}
                      onValueChange={(val) => {
                        if (val === "Other") {
                          setValue("purpose", "", { shouldValidate: true });
                        } else {
                          setValue("purpose", val, { shouldValidate: true });
                        }
                      }}
                    >
                      <SelectTrigger className={cn(
                        "bg-white/5 border-white/10 transition-all",
                        errors.purpose && "border-rose-500/50"
                      )}>
                        <SelectValue placeholder="Select reason for visit" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposeOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <AnimatePresence>
                      {(purposeValue === "" || isCustomPurpose) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2"
                        >
                          <Input
                            {...register("purpose")}
                            placeholder="Please describe..."
                            className={cn(
                              "bg-white/5 border-white/10 focus:border-amber-500/50",
                              errors.purpose && "border-rose-500/50"
                            )}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatedError message={errors.purpose?.message} />
                  </div>
                </div>

                <div className="pt-12 flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setStep(1)}
                    className="flex-1 border border-white/5 hover:bg-white/5"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2] btn-gradient shadow-lg shadow-amber-500/20"
                    disabled={checkIn.isPending}
                  >
                    {checkIn.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Complete Check-In <CheckCircle2 className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </GlossCard>

      {confirmData && (
        <ConfirmationModal
          data={confirmData}
          open
          onClose={() => {
            setConfirmData(null);
            reset();
            setStep(1);
          }}
        />
      )}
    </>
  );
}
