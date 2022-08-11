import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';
import { FrameRateMonitorModule } from './FrameRateMonitorModule';
import { analytics } from '@/analytics';

type FrameRateMonitorType = {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  registerListeners: () => void;
  removeListeners: () => void;
};

const EVENT_NAME = 'Performance Tracked Base Frame Rate Stats';

let isMonitoring = false;
let previousAppState: AppStateStatus | undefined;
let appStateChangeSubscription: NativeEventSubscription | null = null;

function startMonitoring() {
  if (!isMonitoring) {
    isMonitoring = true;
    FrameRateMonitorModule.startMonitoring();
  }
}

async function stopMonitoring() {
  if (isMonitoring) {
    isMonitoring = false;
    await FrameRateMonitorModule.stopMonitoring();
    const stats = await FrameRateMonitorModule.getStats();
    // TODO: Remove TEST prefix before releasing to broader audience
    analytics.track(`$TEST ${EVENT_NAME}`, { frameRateStats: stats });
    global.console.log(JSON.stringify(stats, null, 2));
  }
}

function onAppStateChange(state: AppStateStatus) {
  if (
    previousAppState === 'background' &&
    state === 'active' &&
    !isMonitoring
  ) {
    startMonitoring();
  } else if (state === 'background' && isMonitoring) {
    stopMonitoring();
  }
  previousAppState = state;
}

function registerListeners() {
  appStateChangeSubscription = AppState.addEventListener(
    'change',
    onAppStateChange
  );
}

function removeListeners() {
  if (appStateChangeSubscription) {
    appStateChangeSubscription.remove();
    appStateChangeSubscription = null;
  }
}

export const FrameRateMonitor: FrameRateMonitorType = {
  registerListeners,
  removeListeners,
  startMonitoring,
  stopMonitoring,
};
