"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Lock, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DynamicTargetInputProps {
  index: number;
  uomType: "numeric" | "percentage" | "timeline" | "zero";
  isLocked: boolean;
}

export function DynamicTargetInput({ index, uomType, isLocked }: DynamicTargetInputProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  
  const targetPath = `goals.${index}.targetValue`;
  const targetDatePath = `goals.${index}.targetDate`;
  
  const currentTargetDate = watch(targetDatePath);
  const targetError = (errors?.goals as any)?.[index]?.targetValue?.message;
  const targetDateError = (errors?.goals as any)?.[index]?.targetDate?.message;

  React.useEffect(() => {
    if (uomType === "timeline") {
      setValue(targetPath, undefined, { shouldValidate: true });
    } else {
      setValue(targetDatePath, undefined, { shouldValidate: true });
      if (uomType === "zero") {
        setValue(targetPath, 0, { shouldValidate: true });
      }
    }
  }, [uomType, setValue, targetPath, targetDatePath]);

  return (
    <div className="lg:col-span-2 space-y-2 overflow-hidden">
      <Label className="flex items-center gap-1.5">
        Target Value
        <Tooltip>
          <TooltipTrigger type="button" tabIndex={-1}>
            <Info className="size-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top">
            {uomType === "numeric" && <p className="w-48 text-xs font-normal">Enter measurable numeric KPI target.</p>}
            {uomType === "percentage" && <p className="w-48 text-xs font-normal">Value must remain between 0 and 100.</p>}
            {uomType === "timeline" && <p className="w-48 text-xs font-normal">Select expected completion deadline.</p>}
            {uomType === "zero" && <p className="w-48 text-xs font-normal">This goal succeeds only when value remains zero.</p>}
          </TooltipContent>
        </Tooltip>
      </Label>

      <AnimatePresence mode="wait">
        {uomType === "numeric" && (
          <motion.div
            key="numeric"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Input 
              type="number" 
              placeholder="e.g. 10000"
              {...register(targetPath)}
              disabled={isLocked}
              className={cn(targetError && "border-destructive focus-visible:ring-destructive")}
            />
          </motion.div>
        )}

        {uomType === "percentage" && (
          <motion.div
            key="percentage"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Input 
              type="number" 
              placeholder="e.g. 85"
              {...register(targetPath)}
              disabled={isLocked}
              className={cn("pr-8", targetError && "border-destructive focus-visible:ring-destructive")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
          </motion.div>
        )}

        {uomType === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Popover>
              <PopoverTrigger render={
                <Button
                  variant="outline"
                  disabled={isLocked}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !currentTargetDate && "text-muted-foreground",
                    targetDateError && "border-destructive text-destructive"
                  )}
                />
              }>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {currentTargetDate ? format(new Date(currentTargetDate), "PPP") : <span>Pick a date</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentTargetDate ? new Date(currentTargetDate) : undefined}
                  onSelect={(date) => {
                    setValue(targetDatePath, date, { shouldValidate: true, shouldDirty: true });
                    setValue(targetPath, undefined); // clear number target
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {uomType === "zero" && (
          <motion.div
            key="zero"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Input 
              type="text" 
              value="Target = 0"
              readOnly
              disabled
              className="pl-9 font-medium bg-muted/50 text-muted-foreground"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
          </motion.div>
        )}
      </AnimatePresence>

      {(targetError || targetDateError) && (
        <p className="text-xs text-destructive mt-1 font-medium animate-in fade-in slide-in-from-top-1">
          {targetError || targetDateError}
        </p>
      )}
    </div>
  );
}
