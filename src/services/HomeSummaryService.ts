import { UserProfile } from "../context/ProfileContext";
import { HomeSummaryReportData, HomeSummaryReportResponse } from "../types/homeSummary";
import { EquipmentManual } from "../types/equipmentManual";
import {
  formatProfileAddressLines,
  profileHasAddress,
} from "../utils/formatProfileAddress";
import { formatPurchaseDateLabel } from "../utils/formatPurchaseDate";
import { EquipmentManualService } from "./EquipmentManualService";
import { MaintenanceTaskService } from "./MaintenanceTaskService";
import {
  countHomeSummaryCompletions,
  groupCompletedTasksByRoutine,
} from "../utils/groupHomeSummaryTasks";

function mapEquipmentItem(item: EquipmentManual) {
  return {
    name: item.name,
    modelNumber: item.model_number?.trim() || null,
    purchaseDateLabel: formatPurchaseDateLabel(item.purchase_date),
    hasManual: !!item.manual_storage_path,
    hasReceipt: !!item.receipt_storage_path,
  };
}

export function resolveOwnerName(
  profile: UserProfile | null,
  authFullName?: string | null
): string | null {
  const fromProfile = profile?.full_name?.trim();
  if (fromProfile) return fromProfile;
  const fromAuth = authFullName?.trim();
  return fromAuth || null;
}

export function homeSummaryHasContent(data: HomeSummaryReportData): boolean {
  return (
    data.hasAddress ||
    data.equipment.length > 0 ||
    data.taskGroups.length > 0
  );
}

export { countHomeSummaryCompletions };

export class HomeSummaryService {
  static async fetchReportData(
    profile: UserProfile | null,
    ownerName: string | null
  ): Promise<HomeSummaryReportResponse> {
    try {
      const [equipmentResult, tasksResult] = await Promise.all([
        EquipmentManualService.listEquipmentManuals(),
        MaintenanceTaskService.getCompletedTasks("all", { forExport: true }),
      ]);

      if (equipmentResult.error) {
        return { data: null, error: equipmentResult.error };
      }
      if (tasksResult.error) {
        return { data: null, error: tasksResult.error };
      }

      const addressLines = formatProfileAddressLines(profile);
      const equipment = (equipmentResult.data ?? []).map(mapEquipmentItem);
      const taskGroups = groupCompletedTasksByRoutine(tasksResult.data ?? []);

      const data: HomeSummaryReportData = {
        generatedAt: new Date(),
        ownerName,
        addressLines,
        hasAddress: profileHasAddress(profile),
        equipment,
        taskGroups,
      };

      return { data, error: null };
    } catch (error) {
      console.error("Error building home summary report:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          details: String(error),
        },
      };
    }
  }
}
