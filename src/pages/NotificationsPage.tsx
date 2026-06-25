import type { NotificationItem, UserProfile } from "@/types";
import { NotificationRow } from "@/components/NotificationRow";
import { Button, EmptyState, Panel } from "@/components/ui";

export function NotificationsPage({
  currentUser,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: {
  currentUser: UserProfile;
  notifications: NotificationItem[];
  onMarkRead: (notificationId: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}) {
  const userNotifications = notifications
    .filter((notification) => notification.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = userNotifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-5">
      <Panel className="animate-rise">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Notifications</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-[#142019]">Recent alerts and updates</h1>
            <p className="mt-2 text-sm text-slate-500">Connection requests, accepted connections, messages, and opportunity matches.</p>
          </div>
          <Button variant="outline" disabled={!unreadCount} onClick={() => void onMarkAllRead()}>Mark all read</Button>
        </div>
      </Panel>

      {userNotifications.length ? (
        <Panel>
          <div className="space-y-3">
            {userNotifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onMarkRead={onMarkRead} />
            ))}
          </div>
        </Panel>
      ) : (
        <EmptyState title="No notifications" description="Alerts and updates will appear here when people interact with you." />
      )}
    </div>
  );
}
