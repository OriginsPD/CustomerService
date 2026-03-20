import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="text-cyan-400 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1">{error}</p>
      )}
    </div>
  );
}

export function CheckInForm() {
  const [confirmData, setConfirmData] = useState<CheckInResponse | null>(null);
  const checkIn = useCheckIn();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CheckInForm>({
    resolver: zodResolver(CheckInFormSchema),
    defaultValues: { phone: "", company: "" },
  });

  const purposeValue = watch("purpose");

  const onSubmit = async (data: CheckInForm) => {
    const result = await checkIn.mutateAsync(data);
    setConfirmData(result);
  };

  const isCustomPurpose = !purposeOptions.slice(0, -1).includes(purposeValue as any);

  return (
    <>
      <GlossCard className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">Client Check-In</h2>
              <p className="text-xs text-muted-foreground">
                Register your visit to the Virtual Customer Care Office
              </p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-blue-600/50 to-transparent mt-4" />
        </div>

        {/* Error banner */}
        {checkIn.isError && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {checkIn.error?.message ?? "Something went wrong. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <Field label="Full Name" error={errors.name?.message} required>
            <Input
              {...register("name")}
              placeholder="John Smith"
              className={cn(errors.name && "border-rose-500/50")}
            />
          </Field>

          {/* Email */}
          <Field label="Email Address" error={errors.email?.message} required>
            <Input
              {...register("email")}
              type="email"
              placeholder="john@example.com"
              className={cn(errors.email && "border-rose-500/50")}
            />
          </Field>

          {/* Phone + Company — two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone Number" error={errors.phone?.message}>
              <Input
                {...register("phone")}
                type="tel"
                placeholder="+1 555 000 0000"
              />
            </Field>
            <Field label="Company / Organisation" error={errors.company?.message}>
              <Input {...register("company")} placeholder="Acme Corp" />
            </Field>
          </div>

          {/* Purpose select */}
          <Field label="Purpose of Visit" error={errors.purpose?.message} required>
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
              <SelectTrigger className={cn(errors.purpose && "border-rose-500/50")}>
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

            {/* Custom purpose text input */}
            {(purposeValue === "" ||
              isCustomPurpose) && (
              <Input
                {...register("purpose")}
                placeholder="Describe your purpose of visit…"
                className={cn("mt-2", errors.purpose && "border-rose-500/50")}
              />
            )}
          </Field>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={checkIn.isPending}
            >
              {checkIn.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Check In Now
                </>
              )}
            </Button>
          </div>
        </form>
      </GlossCard>

      {/* Confirmation modal */}
      {confirmData && (
        <ConfirmationModal
          data={confirmData}
          open
          onClose={() => {
            setConfirmData(null);
            reset();
          }}
        />
      )}
    </>
  );
}
