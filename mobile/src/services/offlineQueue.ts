import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { attendanceAPI } from './api';

const OFFLINE_QUEUE_KEY = 'offline_scan_queue';

export interface QueuedScan {
  id: string;
  qrCode: string;
  timestamp: string;
  synced: boolean;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    console.error('[OfflineQueue] Error checking network:', error);
    return true; // Assume online if check fails
  }
}

/**
 * Get all queued scans
 */
export async function getQueuedScans(): Promise<QueuedScan[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[OfflineQueue] Error reading queue:', error);
    return [];
  }
}

/**
 * Add a scan to the offline queue
 */
export async function queueScan(qrCode: string): Promise<QueuedScan> {
  try {
    const queue = await getQueuedScans();
    const newScan: QueuedScan = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      qrCode,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    queue.push(newScan);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log('[OfflineQueue] Scan queued:', newScan.id);
    return newScan;
  } catch (error) {
    console.error('[OfflineQueue] Error queueing scan:', error);
    throw error;
  }
}

/**
 * Remove a scan from the queue
 */
export async function removeScanFromQueue(scanId: string): Promise<void> {
  try {
    const queue = await getQueuedScans();
    const filtered = queue.filter(s => s.id !== scanId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    console.log('[OfflineQueue] Scan removed:', scanId);
  } catch (error) {
    console.error('[OfflineQueue] Error removing scan:', error);
  }
}

/**
 * Get count of pending (unsynced) scans
 */
export async function getPendingScanCount(): Promise<number> {
  const queue = await getQueuedScans();
  return queue.filter(s => !s.synced).length;
}

/**
 * Sync all queued scans to the server
 */
export async function syncQueuedScans(): Promise<{ synced: number; failed: number }> {
  console.log('[OfflineQueue] Starting sync...');
  
  const online = await isOnline();
  if (!online) {
    console.log('[OfflineQueue] Device is offline, skipping sync');
    return { synced: 0, failed: 0 };
  }

  const queue = await getQueuedScans();
  const unsyncedScans = queue.filter(s => !s.synced);
  
  if (unsyncedScans.length === 0) {
    console.log('[OfflineQueue] No scans to sync');
    return { synced: 0, failed: 0 };
  }

  console.log(`[OfflineQueue] Syncing ${unsyncedScans.length} scans...`);
  
  let synced = 0;
  let failed = 0;

  for (const scan of unsyncedScans) {
    try {
      // Try to sync the scan
      await attendanceAPI.recordScan(scan.qrCode);
      
      // Mark as synced and remove from queue
      await removeScanFromQueue(scan.id);
      synced++;
      console.log(`[OfflineQueue] Synced scan: ${scan.id}`);
    } catch (error: any) {
      // If it's a cooldown error, the scan is actually valid, just too soon
      // We can remove it from the queue
      if (error.response?.data?.cooldown) {
        console.log(`[OfflineQueue] Scan ${scan.id} hit cooldown, removing from queue`);
        await removeScanFromQueue(scan.id);
        synced++;
      } else {
        console.error(`[OfflineQueue] Failed to sync scan ${scan.id}:`, error);
        failed++;
      }
    }
  }

  console.log(`[OfflineQueue] Sync complete. Synced: ${synced}, Failed: ${failed}`);
  return { synced, failed };
}

/**
 * Clear all queued scans
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('[OfflineQueue] Queue cleared');
  } catch (error) {
    console.error('[OfflineQueue] Error clearing queue:', error);
  }
}
