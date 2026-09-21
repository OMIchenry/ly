import * as Notifications from 'expo-notifications';
import type { Moment } from './types';
import { displayTitle } from './titles';

// Show the reminder even if the app happens to be open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Moments from this month/day in previous years, newest year first. */
export function onThisDayMoments(moments: Moment[], now = new Date()): Moment[] {
  return moments
    .filter((m) => {
      const d = new Date(m.createdAt);
      return (
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate() &&
        d.getFullYear() < now.getFullYear()
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function nextNineAM(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * (Re)schedule tomorrow's 9am "On this day" reminder based on what the
 * user actually has. Call whenever the home screen loads. Never throws,
 * never nags: permission is requested once, and a denial simply means
 * no reminders.
 */
export async function refreshOnThisDayReminder(
  moments: Moment[],
): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status === 'undetermined') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    // Match memories to the day the notification actually fires (tomorrow),
    // not today — otherwise it arrives a day late with yesterday's memory.
    const fireDate = nextNineAM();
    const otd = onThisDayMoments(moments, fireDate);
    if (otd.length === 0) return;

    const currentYear = new Date().getFullYear();
    let body: string;
    if (otd.length === 1) {
      const yearsAgo = currentYear - new Date(otd[0].createdAt).getFullYear();
      const text = displayTitle(otd[0]);
      const snippet =
        text.length > 90 ? text.slice(0, 90).trimEnd() + '…' : text;
      body =
        `${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago today` +
        (snippet ? ` — “${snippet}”` : '');
    } else {
      body = `You have ${otd.length} memories from this day in past years`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'On this day',
        body,
        data: { screen: 'home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
  } catch {
    // Reminders are a nice-to-have; never break the app over them.
  }
}
