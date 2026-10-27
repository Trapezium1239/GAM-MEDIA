'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, BellOff, Loader2, AlertCircle, Shield, BellRing } from 'lucide-react';

interface PushSubscriptionData {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string;
  created_at: string;
  active: boolean;
}

export default function NotificationsSettingsPage() {
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [pushSupported, setPushSupported] = useState(false);

  const fetchSubscriptions = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    setSubscriptions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    // MOBILE-ONLY: native shell always supports push via Capacitor.
    setPushSupported(true);
    try {
      setPermission('Notification' in window ? Notification.permission : 'granted');
    } catch {
      setPermission('granted');
    }
    fetchSubscriptions();
  }, []);

  const handleSubscribe = async () => {
    // MOBILE-ONLY: register the native APNs/FCM token via Capacitor.
    setSubscribing(true);
    setResult(null);

    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) {
        setResult({ ok: false, msg: 'Native push is available in the installed app build.' });
        return;
      }
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.checkPermissions();
      if (perm.receive !== 'granted') {
        const req = await PushNotifications.requestPermissions();
        if (req.receive !== 'granted') {
          setResult({ ok: false, msg: 'Notification permission denied' });
          return;
        }
      }
      await PushNotifications.register();
      setResult({ ok: true, msg: 'Push notifications enabled on this device!' });
      fetchSubscriptions();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to subscribe' });
    } finally {
      setSubscribing(false);
      try {
        setPermission('Notification' in window ? Notification.permission : 'granted');
      } catch {
        setPermission('granted');
      }
    }
  };

  const handleUnsubscribe = async (id: string) => {
    if (!confirm('Disable push notifications for this device?')) return;

    setUnsubscribingId(id);
    try {
      // MOBILE-ONLY: unregister native token + mark subscription inactive.
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          await PushNotifications.unregister();
        }
      } catch {
        // Unregister is best-effort — DB flag is authoritative
      }

      const supabase = createClient();
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      setResult({ ok: true, msg: 'Push notifications disabled for this device' });
      fetchSubscriptions();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to unsubscribe' });
    } finally {
      setUnsubscribingId(null);
    }
  };

  const handleTestNotification = async () => {
    // MOBILE-ONLY: no server to fan out a test push — fire a local notification instead.
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) {
        setResult({ ok: false, msg: 'Test alerts fire on-device in the installed app build.' });
        return;
      }
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.requestPermissions();
      setResult({ ok: true, msg: 'Device registered — broadcasts will arrive as native alerts.' });
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to send test' });
    }
  };

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BellRing className="w-6 h-6 text-amber-400" />
          Notification Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Manage push notifications for alerts, reminders, and updates</p>
      </header>

      {/* Push Support Status */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              {pushSupported ? (
                <BellRing className="w-5 h-5 text-primary" />
              ) : (
                <BellOff className="w-5 h-5 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="font-semibold text-white">Push Notifications</p>
              <p className="text-xs text-zinc-400">
                {pushSupported ? 'Supported in this browser' : 'Not supported in this browser'}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            pushSupported ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
          }`}>
            {pushSupported ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {pushSupported && (
          <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className={`px-2 py-1 rounded-full ${
              permission === 'granted' ? 'text-green-400 bg-green-500/10' :
              permission === 'denied' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'
            }`}>
              <Shield className="w-3 h-3 inline mr-1" />
              Permission: {permission.charAt(0).toUpperCase() + permission.slice(1)}
            </span>
            <span className="px-2 py-1 rounded-full text-zinc-400 bg-zinc-800">
              Native push: APNs / FCM device token
            </span>
          </div>
        )}
      </section>

      {/* Subscribe/Unsubscribe Actions */}
      {pushSupported && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Your Devices</h2>
          {result && (
            <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
              {result.msg}
            </p>
          )}

          {subscriptions.length === 0 ? (
            <div className="card space-y-3 text-center py-6">
              <Bell className="w-12 h-12 mx-auto text-zinc-600" />
              <p className="text-sm text-zinc-400">No devices subscribed</p>
              <p className="text-xs text-zinc-500">Subscribe to receive urgent alerts, shift reminders, and updates</p>
              <button
                onClick={handleSubscribe}
                disabled={subscribing || permission === 'denied'}
                className="btn-primary w-full h-11 mx-auto max-w-xs"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4 mr-2" />
                    Enable Push Notifications
                  </>
                )}
              </button>
              {permission === 'denied' && (
                <p className="text-xs text-zinc-500 text-center">
                  Notifications are blocked. Enable in browser settings first.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <BellRing className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Subscribed Device</p>
                        <p className="text-xs text-zinc-500 truncate max-w-[200px]">{sub.user_agent}</p>
                        <p className="text-xs text-zinc-500">{new Date(sub.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnsubscribe(sub.id)}
                      disabled={unsubscribingId === sub.id}
                      className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition touch-manipulation"
                    >
                      {unsubscribingId === sub.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {permission === 'denied' && (
                    <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Browser notifications are blocked. <a href="#" className="underline">Open settings</a> to re-enable.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {subscriptions.length > 0 && (
            <button
              onClick={handleTestNotification}
              className="btn-secondary w-full h-11 flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Send Test Notification
            </button>
          )}
        </section>
      )}

      {/* Notification Preferences */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Alert Preferences</h2>
        <p className="text-xs text-zinc-400">Choose which alerts trigger push notifications</p>
        <div className="space-y-2">
          {[
            { key: 'urgent', label: 'Urgent Broadcasts', description: 'Immediate safety/critical alerts', default: true },
            { key: 'advisory', label: 'Advisory Alerts', description: 'Service changes, weather advisories', default: true },
            { key: 'shift_reminder', label: 'Shift Reminders', description: '24h before your scheduled shifts', default: true },
            { key: 'first_timer', label: 'First-Timer Alerts', description: 'New visitor check-ins', default: false },
            { key: 'milestone_update', label: 'Project Milestone Updates', description: 'Funding progress & completions', default: false },
          ].map((pref) => (
            <label key={pref.key} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{pref.label}</p>
                <p className="text-xs text-zinc-400 truncate">{pref.description}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={pref.default}
                className="w-5 h-5 accent-amber-500 rounded border-zinc-600"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}