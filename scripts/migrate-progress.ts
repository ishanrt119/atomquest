import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectToDatabase } from "../src/lib/mongodb";
import { Goal } from "../src/models/Goal";
import { CheckIn } from "../src/models/CheckIn";
import { SharedGoal } from "../src/models/SharedGoal";
import {
  calculateProgress,
  deriveStatusFromProgress,
} from "../src/services/sync/progressCalculationService";

/**
 * Migration Script: Backfill Standardized Progress Fields
 *
 * This script migrates existing records to use the standardized progress architecture:
 *   - rawProgressPercentage
 *   - displayProgressPercentage
 *   - progressStatusLabel
 *
 * It also removes the legacy `progressPercentage` field via $unset.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module": "commonjs", "esModuleInterop": true}' scripts/migrate-progress.ts
 */
async function migrate() {
  console.log("🚀 Starting progress migration...\n");

  await connectToDatabase();

  // ── 1. Migrate Goals ─────────────────────────────────────────────────────
  const goals = await Goal.find({});
  console.log(`📦 Found ${goals.length} goals to migrate.`);
  let goalUpdated = 0;

  for (const goal of goals) {
    const calc = calculateProgress(
      goal.uomType,
      goal.measurementDirection,
      goal.targetValue,
      goal.currentAchievement ?? 0,
      goal.targetDate?.toISOString(),
      null // No actual achievement date on Goal model
    );

    await Goal.findByIdAndUpdate(goal._id, {
      $set: {
        rawProgressPercentage: calc.rawProgressPercentage,
        displayProgressPercentage: calc.displayProgressPercentage,
        progressStatusLabel: calc.progressStatusLabel,
        status: deriveStatusFromProgress(calc.rawProgressPercentage),
      },
      $unset: { progressPercentage: 1 },
    });
    goalUpdated++;
  }
  console.log(`  ✅ Updated ${goalUpdated} goals.\n`);

  // ── 2. Migrate CheckIns ──────────────────────────────────────────────────
  const checkins = await CheckIn.find({});
  console.log(`📦 Found ${checkins.length} checkins to migrate.`);
  let ciUpdated = 0;

  for (const ci of checkins) {
    const goal = await Goal.findById(ci.goalId).lean();
    if (!goal) continue;

    const calc = calculateProgress(
      goal.uomType,
      goal.measurementDirection,
      goal.targetValue,
      ci.actualAchievementValue ?? 0,
      ci.plannedTargetDate?.toISOString(),
      ci.actualAchievementDate?.toISOString()
    );

    await CheckIn.findByIdAndUpdate(ci._id, {
      $set: {
        rawProgressPercentage: calc.rawProgressPercentage,
        displayProgressPercentage: calc.displayProgressPercentage,
        progressStatusLabel: calc.progressStatusLabel,
        status: deriveStatusFromProgress(calc.rawProgressPercentage),
      },
      $unset: { progressPercentage: 1 },
    });
    ciUpdated++;
  }
  console.log(`  ✅ Updated ${ciUpdated} checkins.\n`);

  // ── 3. Migrate SharedGoals ───────────────────────────────────────────────
  const sharedGoals = await SharedGoal.find({});
  console.log(`📦 Found ${sharedGoals.length} shared goals to migrate.`);
  let sgUpdated = 0;

  for (const sg of sharedGoals) {
    const calc = calculateProgress(
      sg.uomType,
      sg.measurementDirection,
      sg.targetValue,
      sg.currentAchievement ?? 0,
      sg.targetDate?.toISOString(),
      null
    );

    await SharedGoal.findByIdAndUpdate(sg._id, {
      $set: {
        rawProgressPercentage: calc.rawProgressPercentage,
        displayProgressPercentage: calc.displayProgressPercentage,
        progressStatusLabel: calc.progressStatusLabel,
        status: deriveStatusFromProgress(calc.rawProgressPercentage),
      },
      $unset: { progressPercentage: 1 },
    });
    sgUpdated++;
  }
  console.log(`  ✅ Updated ${sgUpdated} shared goals.\n`);

  console.log("🎉 Migration completed successfully!");
  console.log(
    `   Goals: ${goalUpdated} | CheckIns: ${ciUpdated} | SharedGoals: ${sgUpdated}`
  );
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
