import type { NotificationItem } from "@/types";
import { relativeTime } from "@/utils/helpers";
import { cn } from "@/utils/cn";
import { Badge, Button } from "./ui";

export function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: NotificationItem;
  onMarkRead: (notificationId: string) => Promise<void>;
}) {
  const tone = notification.type === "connection_request" ? "gold" : notification.type === "connection_accepted" ? "green" : notification.type === "opportunity_match" ? "primary" : "neutral";
  return (
    <div className={cn("rounded-3xl border p-4 transition duration-200 cursor-pointer", notification.read ? "border-slate-200 bg-white hover:shadow-sm hover:shadow-slate-200/70" : "border-[#D4AF37]/40 bg-[#D4AF37]/10 hover:border-[#D4AF37]/60 hover:shadow-sm hover:shadow-[#D4AF37]/20")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={tone}>{notification.type.replace(/_/g, " ")}</Badge>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#142019]">{notification.message}</p>
          <p className="mt-1 text-xs text-slate-500">{relativeTime(notification.createdAt)}</p>
        </div>
        {!notification.read ? <Button variant="ghost" size="sm" onClick={() => void onMarkRead(notification.id)}>Mark read</Button> : null}
      </div>
    </div>
  );
}
