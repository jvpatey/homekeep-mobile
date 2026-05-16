import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

const LOGO_MODULE = require("../../assets/images/homekeep-logo.png");

let cachedLogoDataUri: string | null | undefined;

/** Base64 data URI for the HomeKeep logo, for HTML/PDF export. */
export async function getHomekeepLogoDataUri(): Promise<string | null> {
  if (cachedLogoDataUri !== undefined) {
    return cachedLogoDataUri;
  }

  try {
    const asset = Asset.fromModule(LOGO_MODULE);
    await asset.downloadAsync();
    if (!asset.localUri) {
      cachedLogoDataUri = null;
      return null;
    }

    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: "base64",
    });
    cachedLogoDataUri = `data:image/png;base64,${base64}`;
    return cachedLogoDataUri;
  } catch (error) {
    console.warn("Could not load HomeKeep logo for PDF:", error);
    cachedLogoDataUri = null;
    return null;
  }
}
