import type { BobDeliverable } from "@/platform/api/bob/milestones";
import {
  deliverableAppliesToTeam,
  teamNamesFromDeliverables,
} from "./deliverableTeamReview";

export const DELIVERABLE_SLOTS = [1, 2, 3, 4] as const;
export type DeliverableSlot = (typeof DELIVERABLE_SLOTS)[number];

export type DeliverableSlotMap = Map<DeliverableSlot, BobDeliverable>;

export function parseDeliverableSlot(
  num: string | null | undefined,
): DeliverableSlot | null {
  if (!num) return null;
  const match = String(num).trim().match(/(\d+)/);
  if (!match) return null;
  const n = Number(match[1]);
  if (n >= 1 && n <= 4) return n as DeliverableSlot;
  return null;
}

export function deliverableSlotLabel(slot: DeliverableSlot): string {
  return `D${slot}`;
}

export function sortByDeliverableNumber(
  items: BobDeliverable[],
): BobDeliverable[] {
  return [...items].sort((a, b) => {
    const na = parseDeliverableSlot(a.deliverableNumber) ?? 99;
    const nb = parseDeliverableSlot(b.deliverableNumber) ?? 99;
    if (na !== nb) return na - nb;
    return a.deliverableName.localeCompare(b.deliverableName);
  });
}

export function deliverablesToSlotMap(items: BobDeliverable[]): DeliverableSlotMap {
  const map: DeliverableSlotMap = new Map();
  for (const d of sortByDeliverableNumber(items)) {
    const slot = parseDeliverableSlot(d.deliverableNumber);
    if (slot && !map.has(slot)) map.set(slot, d);
  }
  return map;
}

export interface DeliverableTrackRow {
  trackName: string;
  slots: DeliverableSlotMap;
  items: BobDeliverable[];
}

export function groupDeliverablesByTrack(
  deliverables: BobDeliverable[],
): DeliverableTrackRow[] {
  const map = new Map<string, BobDeliverable[]>();
  for (const d of deliverables) {
    const key = d.trackName || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }
  return [...map.entries()]
    .map(([trackName, items]) => ({
      trackName,
      items: sortByDeliverableNumber(items),
      slots: deliverablesToSlotMap(items),
    }))
    .sort((a, b) => a.trackName.localeCompare(b.trackName));
}

export interface DeliverableTeamRow {
  teamName: string;
  slots: DeliverableSlotMap;
  items: BobDeliverable[];
}

export function deliverablesToTeamSlotMap(
  teamName: string,
  items: BobDeliverable[],
): DeliverableSlotMap {
  const map: DeliverableSlotMap = new Map();
  for (const d of sortByDeliverableNumber(items)) {
    if (!deliverableAppliesToTeam(d, teamName)) continue;
    const slot = parseDeliverableSlot(d.deliverableNumber);
    if (slot && !map.has(slot)) map.set(slot, d);
  }
  return map;
}

export function groupDeliverablesByTeam(
  deliverables: BobDeliverable[],
): DeliverableTeamRow[] {
  return teamNamesFromDeliverables(deliverables).map((teamName) => {
    const items = deliverables.filter((d) => deliverableAppliesToTeam(d, teamName));
    return {
      teamName,
      items: sortByDeliverableNumber(items),
      slots: deliverablesToTeamSlotMap(teamName, deliverables),
    };
  });
}
