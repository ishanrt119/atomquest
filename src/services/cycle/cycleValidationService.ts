import { GoalCycle, IGoalCycle } from "@/models/GoalCycle";
import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";

export const createCycle = async (data: Partial<IGoalCycle>, userId: string) => {
  // Validate dates sequentially
  const dates = [
    new Date(data.goalSettingStart!),
    new Date(data.goalSettingEnd!),
    new Date(data.q1Start!),
    new Date(data.q1End!),
    new Date(data.q2Start!),
    new Date(data.q2End!),
    new Date(data.q3Start!),
    new Date(data.q3End!),
    new Date(data.q4Start!),
    new Date(data.q4End!),
  ];

  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i] >= dates[i + 1]) {
      throw new Error("Dates must be sequential and non-overlapping.");
    }
  }

  const newCycle = new GoalCycle({
    ...data,
    createdBy: new mongoose.Types.ObjectId(userId),
    updatedBy: new mongoose.Types.ObjectId(userId)
  });

  await newCycle.save();

  await AuditLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    userRole: "admin",
    actionType: "CREATED",
    entityType: "GoalCycle",
    entityId: newCycle._id,
    newValue: newCycle.toObject(),
    reason: `Created new goal cycle for year ${newCycle.cycleYear}`,
  });

  return newCycle;
};

export const updateCycle = async (id: string, data: Partial<IGoalCycle>, userId: string) => {
  const cycle = await GoalCycle.findById(id);
  if (!cycle) throw new Error("Cycle not found");

  Object.assign(cycle, { ...data, updatedBy: new mongoose.Types.ObjectId(userId) });
  await cycle.save();

  await AuditLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    userRole: "admin",
    actionType: "UPDATED",
    entityType: "GoalCycle",
    entityId: cycle._id,
    fieldChanged: "cycle configuration",
    newValue: data,
    reason: `Updated goal cycle for year ${cycle.cycleYear}`,
  });

  return cycle;
};

export const activateCycle = async (id: string, userId: string) => {
  // Deactivate all first
  await GoalCycle.updateMany({}, { isActive: false });
  
  const cycle = await GoalCycle.findByIdAndUpdate(id, { isActive: true }, { new: true });
  if (!cycle) throw new Error("Cycle not found");

  await AuditLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    userRole: "admin",
    actionType: "UPDATED",
    entityType: "GoalCycle",
    entityId: cycle._id,
    fieldChanged: "isActive",
    newValue: true,
    reason: `Activated goal cycle for year ${cycle.cycleYear}`,
  });

  return cycle;
};

export const applyAdminOverride = async (id: string, overrideData: IGoalCycle["adminOverride"], userId: string) => {
  const cycle = await GoalCycle.findById(id);
  if (!cycle) throw new Error("Cycle not found");

  cycle.adminOverride = overrideData;
  cycle.updatedBy = new mongoose.Types.ObjectId(userId);
  await cycle.save();

  await AuditLog.create({
    userId: new mongoose.Types.ObjectId(userId),
    userRole: "admin",
    actionType: "ADMIN_OVERRIDE",
    entityType: "GoalCycle",
    entityId: cycle._id,
    fieldChanged: "adminOverride",
    newValue: overrideData,
    reason: overrideData?.reason || 'None',
  });

  return cycle;
};
