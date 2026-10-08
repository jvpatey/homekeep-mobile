import { UserProfile } from "../context/ProfileContext";
import { HomeSummaryReportData, HomeSummaryReportResponse } from "../types/homeSummary";
import { EquipmentManual } from "../types/equipmentManual";
import {
  HomeNotes,
  PAINT_FINISH_LABELS,
  paintTitle,
} from "../types/homeNotes";
import {
  formatProfileAddressLines,
  profileHasAddress,
} from "../utils/formatProfileAddress";
import { formatPurchaseDateLabel } from "../utils/formatPurchaseDate";
import { resolveWarrantyFields } from "../utils/equipmentWarranty";
import { currencyForCountry } from "../utils/formatMoney";
import { formatHomeAge } from "../data/maintenancePlans/homeSystems";
import { EquipmentManualService } from "./EquipmentManualService";
import { MaintenanceTaskService } from "./MaintenanceTaskService";
import {
  countHomeSummaryCompletions,
  computeHomeSummarySpendTotals,
  groupCompletedTasksByRoutine,
} from "../utils/groupHomeSummaryTasks";

function mapEquipmentItem(item: EquipmentManual) {
  const warranty = resolveWarrantyFields(item.warranty_expires_on);
  return {
    name: item.name,
    manufacturer: item.manufacturer?.trim() || null,
    modelNumber: item.model_number?.trim() || null,
    serialNumber: item.serial_number?.trim() || null,
    purchaseDateLabel: formatPurchaseDateLabel(item.purchase_date),
    hasManual: !!item.manual_storage_path,
    hasReceipt: !!item.receipt_storage_path,
    warrantyExpiresOn: warranty.warrantyExpiresOn,
    warrantyExpiresLabel: warranty.warrantyExpiresLabel,
    warrantyStatus: warranty.warrantyStatus,
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
    data.paints.length > 0 ||
    data.taskGroups.length > 0
  );
}

export { countHomeSummaryCompletions };

export class HomeSummaryService {
  static async fetchReportData(
    profile: UserProfile | null,
    ownerName: string | null,
    homeNotes?: HomeNotes
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
      const completed = tasksResult.data ?? [];
      const taskGroups = groupCompletedTasksByRoutine(completed);
      const spendTotals = computeHomeSummarySpendTotals(completed);

      const data: HomeSummaryReportData = {
        generatedAt: new Date(),
        ownerName,
        addressLines,
        hasAddress: profileHasAddress(profile),
        homeAgeLabel: formatHomeAge(profile?.home_systems),
        equipment,
        taskGroups,
        spendTotals,
        paints: (homeNotes?.paints ?? [])
          .map((paint) => ({
            room: paint.room,
            name: paintTitle(paint),
            brand: paint.brand?.trim() || null,
            code: paint.colorCode?.trim() || null,
            finish: paint.finish ? PAINT_FINISH_LABELS[paint.finish] : null,
            hex: paint.hex ?? null,
          }))
          .sort((a, b) => a.room.localeCompare(b.room)),
        currency: currencyForCountry(profile?.country),
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
