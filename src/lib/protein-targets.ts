import type { ProteinTargetPerson, UserSettings } from "@/lib/types";

export const MAX_PROTEIN_TARGET_PEOPLE = 12;
export const DEFAULT_BODY_WEIGHT_KG = 75;
export const DEFAULT_PROTEIN_G_PER_KG = 2;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function createDefaultProteinTarget(index: number): ProteinTargetPerson {
  return {
    id: `person-${index + 1}`,
    label: `Person ${index + 1}`,
    bodyWeightKg: DEFAULT_BODY_WEIGHT_KG,
    proteinGPerKg: DEFAULT_PROTEIN_G_PER_KG,
  };
}

export function createDefaultProteinTargets(count = MAX_PROTEIN_TARGET_PEOPLE) {
  return Array.from({ length: clamp(Math.round(count), 1, MAX_PROTEIN_TARGET_PEOPLE) }, (_, index) =>
    createDefaultProteinTarget(index),
  );
}

export function normalizeProteinTargets(
  proteinTargets: ProteinTargetPerson[] | undefined,
  minimumCount = 1,
) {
  const targetCount = clamp(
    Math.max(Math.round(minimumCount), proteinTargets?.length ?? 0, 1),
    1,
    MAX_PROTEIN_TARGET_PEOPLE,
  );

  return Array.from({ length: targetCount }, (_, index) => {
    const fallback = createDefaultProteinTarget(index);
    const target = proteinTargets?.[index];

    return {
      id: target?.id?.trim() || fallback.id,
      label: target?.label?.trim() || fallback.label,
      bodyWeightKg: Number(clamp(finiteNumber(target?.bodyWeightKg, fallback.bodyWeightKg), 30, 250).toFixed(1)),
      proteinGPerKg: Number(clamp(finiteNumber(target?.proteinGPerKg, fallback.proteinGPerKg), 0.5, 4).toFixed(1)),
    };
  });
}

export function proteinGramsForPerson(target: ProteinTargetPerson) {
  return Number((target.bodyWeightKg * target.proteinGPerKg).toFixed(1));
}

export function activeProteinTargets(settings: UserSettings) {
  const activeCount = clamp(Math.round(settings.defaultPeopleCount), 1, MAX_PROTEIN_TARGET_PEOPLE);
  return normalizeProteinTargets(settings.proteinTargets, activeCount).slice(0, activeCount);
}

export function averageActiveProteinTargetGrams(settings: UserSettings) {
  const activeTargets = activeProteinTargets(settings);

  if (activeTargets.length === 0) {
    return 0;
  }

  return Number(
    (
      activeTargets.reduce((sum, target) => sum + proteinGramsForPerson(target), 0) /
      activeTargets.length
    ).toFixed(1),
  );
}
