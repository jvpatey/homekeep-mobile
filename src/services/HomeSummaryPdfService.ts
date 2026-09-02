import { format } from "date-fns";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { HomeSummaryReportData } from "../types/homeSummary";
import { buildHomeSummaryReportHtml } from "../templates/homeSummaryReportHtml";

export interface HomeSummaryPdfResult {
  success: boolean;
  error?: string;
}

export class HomeSummaryPdfService {
  static async exportAndShare(
    data: HomeSummaryReportData
  ): Promise<HomeSummaryPdfResult> {
    try {
      const html = buildHomeSummaryReportHtml(data);
      const { uri } = await Print.printToFileAsync({
        html,
        margins: {
          left: 52,
          right: 52,
          top: 64,
          bottom: 72,
        },
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        return {
          success: false,
          error: "Sharing is not available on this device.",
        };
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Home maintenance summary",
      });

      return { success: true };
    } catch (error) {
      console.error("Error exporting home summary PDF:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF. Please try again.",
      };
    }
  }

  static suggestedFilename(data: HomeSummaryReportData): string {
    return `HomeKeep-Summary-${format(data.generatedAt, "yyyy-MM-dd")}.pdf`;
  }
}
