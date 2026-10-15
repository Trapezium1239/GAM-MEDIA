'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';

interface NativeAlertRow {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'advisory' | 'urgent';
}

/**
 * MOBILE-ONLY push registration + realtime alert listener.
 * - Requests native push permission on launch via Capacitor.
 * - Upserts the APNs/FCM token directly into push_subscriptions (Supabase).
 * - Subscribes to new `alerts` rows via Realtime → in-app toast.
 * No /api routes — static export has no server.
 */
export function NativePushBootstrap() {
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    let removePushListeners: (() => void) | null = null;
    let realtimeChannel: { unsubscribe: () => void } | null = null;

    (async () => {
      // --- 1. Native push registration (device only) ---
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const perm = await PushNotifications.checkPermissions();
          if (perm.receive !== 'granted') {
            await PushNotifications.requestPermissions();
          }
          await PushNotifications.register();

          const regListener = await PushNotifications.addListener('registration', async (token) => {
            try {
              // MOBILE-ONLY: upsert device token straight into Supabase.
              const supabase = createClient();
              const {
                data: { user },
              } = await supabase.auth.getUser();
              const endpoint = `native:${Capacitor.getPlatform()}:${token.value}`;
              if (user) {
                await supabase.from('push_subscriptions').upsert(
                  {
                    user_id: user.id,
                    endpoint,
                    p256dh: Capacitor.getPlatform(),
                    auth: 'native-fcm-apns',
                    user_agent: `gam-native/${Capacitor.getPlatform()}`,
                    active: true,
                  },
                  { onConflict: 'user_id,endpoint' }
                );
              } else {
                await supabase.from('push_subscriptions').upsert(
                  {
                    endpoint,
                    p256dh: Capacitor.getPlatform(),
                    auth: 'native-fcm-apns',
                    user_agent: `gam-native/${Capacitor.getPlatform()}`,
                    active: true,
                  },
                  { onConflict: 'endpoint' }
                );
              }
            } catch {
              // Token sync is best-effort — in-app toasts remain the fallback
            }
          });
          const regErrorListener = await PushNotifications.addListener('registrationError', () => {
            // Silent — falls back to web push / in-app toasts
          });
          const receivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            if (cancelled) return;
            toast({
              type: notification.data?.level === 'urgent' ? 'error' : 'info',
              title: notification.title || 'Church broadcast',
              description: notification.body,
              duration: 6000,
            });
          });
          removePushListeners = () => {
            void regListener.remove();
            void regErrorListener.remove();
            void receivedListener.remove();
          };
        }
      } catch {
        // Web build — skip native registration entirely
      }

      // --- 2. Realtime alerts ticker (native) ---
      try {
        const supabase = createClient();
        const channel = supabase
          .channel('native-alerts')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'alerts' },
            (payload) => {
              if (cancelled) return;
              const row = payload.new as NativeAlertRow;
              toast({
                type: row.level === 'urgent' ? 'error' : 'info',
                title: row.title,
                description: row.message,
                duration: row.level === 'urgent' ? 10000 : 6000,
              });
            }
          )
          .subscribe();
        realtimeChannel = {
          unsubscribe: () => {
            void supabase.removeChannel(channel);
          },
        };
      } catch {
        // Realtime optional — polling ticker remains the fallback
      }
    })();

    return () => {
      cancelled = true;
      if (removePushListeners) removePushListeners();
      if (realtimeChannel) realtimeChannel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
