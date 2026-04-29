import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import RNFS from "react-native-fs";

/**
 * Request storage permission for Android
 */
const requestStoragePermission = async () => {
  if (Platform.OS !== "android") return true;

  try {
    if (Platform.Version >= 33) {
      const images = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      const videos = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      );
      return (
        images === PermissionsAndroid.RESULTS.GRANTED &&
        videos === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "App needs access to your storage to save photos and videos.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (err) {
    console.warn("Permission request error:", err);
    return false;
  }
};

/**
 * Save media to local storage (Gallery)
 * @param {string} url - The remote URL or local path
 * @param {string} type - 'image' or 'video'
 */
export const saveMediaToLocal = async (url, type) => {
  if (!url) return;

  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      console.log("Permission denied to save media");
      return;
    }

    // If it's a remote URL, we need to download it first
    let localPath = url;
    if (url.startsWith("http")) {
      const extension = type === "video" ? "mp4" : "jpg";
      const fileName = `Tether_${Date.now()}.${extension}`;
      localPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error("Failed to download media");
      }
      
      // On Android, we need file:// prefix for CameraRoll
      if (Platform.OS === "android") {
        localPath = `file://${localPath}`;
      }
    }

    // Save to CameraRoll
    await CameraRoll.saveAsset(localPath, { type: type === "video" ? "video" : "photo", album: "Tether" });
    console.log(`✅ Saved ${type} to gallery: ${url}`);
    
    // Cleanup temporary file if it was downloaded
    if (url.startsWith("http")) {
      const pathToRemove = localPath.replace("file://", "");
      await RNFS.unlink(pathToRemove).catch(() => {});
    }
  } catch (error) {
    console.error("❌ Error saving media to local:", error);
  }
};
