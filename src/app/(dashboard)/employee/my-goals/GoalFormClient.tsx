"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Trash2, Save, Send, AlertTriangle, Lock, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GoalArrayZodSchema, GoalFormValues } from "@/validations/goals";
import { DynamicTargetInput } from "./DynamicTargetInput";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function GoalFormClient({ initialSheet, initialGoals }: { initialSheet: any, initialGoals: any[] }) {
  const [sheet, setSheet] = useState(initialSheet);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isLocked = sheet.locked || sheet.status === "submitted" || sheet.status === "approved";

  const methods = useForm<GoalFormValues>({
    resolver: zodResolver(GoalArrayZodSchema) as any,
    defaultValues: {
      goals: initialGoals.length > 0 ? initialGoals : [{
        title: "",
        description: "",
        thrustArea: "Core",
        uomType: "numeric",
        measurementDirection: "max",
        targetValue: undefined,
        weightage: 10,
        isSharedGoal: false,
      }],
    },
    mode: "onChange",
  });

  const { control, register, watch, handleSubmit, formState: { errors } } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "goals",
  });

  const watchGoals = watch("goals") || [];
  const totalWeightage = watchGoals.reduce((acc, curr) => acc + (Number(curr?.weightage) || 0), 0);
  const arrayError = errors.goals?.message;

  const handleSaveDraft = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    // We get current values (we can save draft even if not perfectly valid, but we must enforce 8 max)
    const currentGoals = methods.getValues("goals");
    if (currentGoals.length > 8) {
      setErrorMsg("Maximum of 8 goals allowed.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalSheetId: sheet._id, goals: currentGoals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg("Draft saved successfully!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: GoalFormValues) => {
    setErrorMsg("");
    setSuccessMsg("");

    // Client-side validation check before hitting API
    if (totalWeightage !== 100) {
      setErrorMsg(`Total weightage must be exactly 100%. Current is ${totalWeightage}%.`);
      return;
    }

    setLoading(true);
    try {
      // 1. Save goals first
      const saveRes = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalSheetId: sheet._id, goals: data.goals }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error);

      // 2. Submit the sheet
      const res = await fetch(`/api/goalsheets/${sheet._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      setSheet(resData.data);
      setSuccessMsg("Goal sheet submitted for manager approval!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">

          {/* Sticky Action Bar */}
          <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md p-4 border-b -mx-4 md:-mx-8 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant={sheet.status === "approved" ? "default" : sheet.status === "rejected" ? "destructive" : "secondary"} className="uppercase">
                {sheet.status}
              </Badge>
              {isLocked && <Badge variant="outline" className="text-amber-600 bg-amber-50"><Lock className="size-3 mr-1" /> Locked</Badge>}
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3 w-full md:w-64">
                <span className="text-sm font-medium whitespace-nowrap">Weightage: {totalWeightage}%</span>
                <Progress
                  value={totalWeightage}
                  className={`h-2 flex-1 ${totalWeightage === 100 ? '[&>div]:bg-green-500' : totalWeightage > 100 ? '[&>div]:bg-red-500' : ''}`}
                />
              </div>

              {!isLocked && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={loading}><Save className="size-4 mr-2" /> Save Draft</Button>
                  <Button type="submit" disabled={loading || totalWeightage !== 100 || fields.length === 0}><Send className="size-4 mr-2" /> Submit</Button>
                </div>
              )}
            </div>
          </div>

          {(errorMsg || arrayError) && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="size-5 mt-0.5" />
              <p className="text-sm font-medium">{errorMsg || (arrayError as string)}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-500/10 text-green-700 border border-green-500/20 p-4 rounded-xl">
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {/* Goal Cards */}
          <div className="space-y-6">
            <AnimatePresence>
              {fields.map((field: any, index) => {
                const goalError = errors?.goals?.[index] as any;
                const currentUomType = watch(`goals.${index}.uomType`) || "numeric";
                const isShared = watch(`goals.${index}.isSharedGoal`);

                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-6 rounded-2xl border bg-card relative ${isShared ? 'border-blue-500/30 bg-blue-50/30' : ''}`}
                  >
                    {isShared && (
                      <div className="absolute -top-3 -right-2 flex gap-2">
                        <Badge className="bg-blue-500 text-white shadow-sm flex items-center gap-1.5 px-3">
                          <Lock className="size-3" /> Managed by Shared Goal
                        </Badge>
                      </div>
                    )}

                    {isShared && field.syncedAt && (
                      <div className="mb-4 bg-muted/30 p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Shared Progress Synced</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Last synced: {format(new Date(field.syncedAt), "dd/MM/yyyy, HH:mm:ss")}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Achievement</p>
                            <p className="font-bold">{field.currentAchievement ?? 0}</p>
                          </div>
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span className="font-bold">{field.progressPercentage ?? 0}%</span>
                            </div>
                            <Progress value={field.progressPercentage ?? 0} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-lg font-semibold">Goal #{index + 1}</h3>
                      {!isLocked && !isShared && (
                        <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                      {/* Title */}
                      <div className="lg:col-span-2 space-y-2">
                        <Label className="flex items-center gap-1.5">
                          Title
                          <Tooltip>
                            <TooltipTrigger type="button" tabIndex={-1}>
                              <Info className="size-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="w-48 text-xs font-normal">A short, clear name for what you want to achieve.</p>
                            </TooltipContent>
                          </Tooltip>
                          {isShared && <span className="text-[10px] text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded border">Read-only</span>}
                        </Label>
                        <Input
                          placeholder="Enter goal title..."
                          {...register(`goals.${index}.title`)}
                          disabled={isLocked || isShared}
                          className={cn(goalError?.title && "border-destructive")}
                        />
                        {goalError?.title && <p className="text-xs text-destructive">{goalError.title.message}</p>}
                      </div>

                      {/* Thrust Area */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          Thrust Area
                          <Tooltip>
                            <TooltipTrigger type="button" tabIndex={-1}>
                              <Info className="size-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="w-48 text-xs font-normal">The high-level strategic category this goal falls under.</p>
                            </TooltipContent>
                          </Tooltip>
                          {isShared && <span className="text-[10px] text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded border">Read-only</span>}
                        </Label>
                        <select
                          className={cn(
                            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            goalError?.thrustArea && "border-destructive"
                          )}
                          {...register(`goals.${index}.thrustArea`)}
                          disabled={isLocked || isShared}
                        >
                          <option value="Core">Core Objectives</option>
                          <option value="Innovation">Innovation</option>
                          <option value="Leadership">Leadership</option>
                        </select>
                      </div>

                      {/* Weightage */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          Weightage (%)
                          <Tooltip>
                            <TooltipTrigger type="button" tabIndex={-1}>
                              <Info className="size-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="w-48 text-xs font-normal">How much this goal contributes to your overall 100% performance score.</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          type="number"
                          min="10"
                          max="100"
                          {...register(`goals.${index}.weightage`)}
                          disabled={isLocked}
                          className={cn(goalError?.weightage && "border-destructive")}
                        />
                        {goalError?.weightage && <p className="text-[10px] text-destructive">{goalError.weightage.message}</p>}
                      </div>

                      {/* Description */}
                      <div className="lg:col-span-4 space-y-2">
                        <Label className="flex items-center gap-1.5">
                          Description
                          <Tooltip>
                            <TooltipTrigger type="button" tabIndex={-1}>
                              <Info className="size-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="w-48 text-xs font-normal">Detailed steps or context on how you will accomplish this goal.</p>
                            </TooltipContent>
                          </Tooltip>
                          {isShared && <span className="text-[10px] text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded border">Read-only</span>}
                        </Label>
                        <Textarea
                          placeholder="Provide details about how you will achieve this..."
                          {...register(`goals.${index}.description`)}
                          disabled={isLocked}
                          className="resize-none"
                        />
                      </div>

                      {/* UoM Type */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          UoM Type
                          <Tooltip>
                            <TooltipTrigger type="button" tabIndex={-1}>
                              <Info className="size-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="w-48 text-xs font-normal">Unit of Measurement. How the target is tracked (e.g., as a raw number or percentage).</p>
                            </TooltipContent>
                          </Tooltip>
                          {isShared && <span className="text-[10px] text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded border">Read-only</span>}
                        </Label>
                        <select
                          className={cn(
                            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            goalError?.uomType && "border-destructive"
                          )}
                          {...register(`goals.${index}.uomType`)}
                          disabled={isLocked || isShared}
                        >
                          <option value="numeric">Numeric Value</option>
                          <option value="percentage">Percentage</option>
                          <option value="timeline">Timeline/Date</option>
                          <option value="zero">Zero Defects</option>
                        </select>
                      </div>

                      {/* Direction */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          Direction
                          <Tooltip>
                            <TooltipTrigger type="button" tabIndex={-1}>
                              <Info className="size-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="w-48 text-xs font-normal">Whether a higher number is better (Maximize) or a lower number is better (Minimize).</p>
                            </TooltipContent>
                          </Tooltip>
                          {isShared && <span className="text-[10px] text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded border">Read-only</span>}
                        </Label>
                        <select
                          className={cn(
                            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            goalError?.measurementDirection && "border-destructive"
                          )}
                          {...register(`goals.${index}.measurementDirection`)}
                          disabled={isLocked || isShared}
                        >
                          <option value="max">Maximize (Higher is better)</option>
                          <option value="min">Minimize (Lower is better)</option>
                        </select>
                      </div>

                      {/* Dynamic Target Input */}
                      <DynamicTargetInput
                        index={index}
                        uomType={currentUomType as any}
                        isLocked={isLocked || isShared}
                      />

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Add Button */}
          {!isLocked && fields.length < 8 && (
            <Button type="button" variant="outline" className="w-full border-dashed h-14 bg-transparent hover:bg-muted/50" onClick={() => append({
              title: "",
              description: "",
              thrustArea: "Core",
              uomType: "numeric",
              measurementDirection: "max",
              targetValue: undefined,
              weightage: 10,
              isSharedGoal: false,
            })}>
              <PlusCircle className="size-5 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Add New Goal</span>
            </Button>
          )}

          {!isLocked && fields.length >= 8 && (
            <p className="text-center text-sm text-muted-foreground">Maximum of 8 goals reached.</p>
          )}

        </form>
      </FormProvider>
    </TooltipProvider>
  );
}
