import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import type { RefObject } from "react";
import type { View } from "react-native";
import {
  YearInReviewReportData,
  buildYearInReviewHtml,
} from "../templates/yearInReviewHtml";

export interface ShareResult {
  success: boolean;
  error?: string;
}

async function share(
  uri: string,
  options: Sharing.SharingOptions
): Promise<ShareResult> {
  if (!(await Sharing.isAvailableAsync())) {
    return { success: false, error: "Sharing is not available on this device." };
  }
  await Sharing.shareAsync(uri, options);
  return { success: true };
}

function failure(label: string, error: unknown): ShareResult {
  console.error(label, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Please try again.",
  };
}

export class YearInReviewShareService {
  /** Captures the on-screen card at full resolution and opens the share sheet. */
  static async shareImage(
    card: RefObject<View | null>,
    year: number
  ): Promise<ShareResult> {
    try {
      const uri = await captureRef(card, {
        format: "png",
        quality: 1,
        width: 1080,
        height: 1350,
        result: "tmpfile",
        fileName: `HomeKeep-${year}-Year-in-Review`,
      });
      return await share(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: `${year} Year in Review`,
      });
    } catch (error) {
      return failure("Error sharing year in review image:", error);
    }
  }

  static async sharePdf(data: YearInReviewReportData): Promise<ShareResult> {
    try {
      const { uri } = await Print.printToFileAsync({
        html: buildYearInReviewHtml(data),
        margins: { left: 52, right: 52, top: 64, bottom: 72 },
      });
      return await share(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: `${data.review.year} Year in Review`,
      });
    } catch (error) {
      return failure("Error exporting year in review PDF:", error);
    }
  }
}
