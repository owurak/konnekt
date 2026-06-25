import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { IconName, UserProfile } from "@/types";
import { cn } from "@/utils/cn";
import { getInitials } from "@/utils/helpers";
import { Icon } from "./Icon";

export function Spinner({ label = "Loading", size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
          size === "sm" && "h-3.5 w-3.5",
          size === "md" && "h-5 w-5",
          size === "lg" && "h-8 w-8"
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF9] p-6">
      <div className="animate-rise text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0B6B3A] text-white shadow-xl shadow-emerald-900/10">
          <Spinner size="lg" label={label} />
        </div>
        <p className="font-heading text-lg font-semibold text-[#142019]">{label}</p>
        <p className="mt-2 text-sm text-slate-500">Connecting opportunities. Building success.</p>
      </div>
    </div>
  );
}

export function OfflineScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF9] p-6 text-[#142019]">
      <Panel className="max-w-xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0B6B3A]/10 text-[#0B6B3A]">
          <Icon name="link" className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Connection required</p>
        <h1 className="mt-3 font-heading text-3xl font-bold">Konnekt is offline</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          This is a live networking platform, so profiles, messages, uploads, and opportunities need an internet connection.
        </p>
        <Button className="mt-6" type="button" onClick={() => window.location.reload()}>
          Retry connection
        </Button>
      </Panel>
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#0B6B3A]/15",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[#0B6B3A] text-white shadow-lg shadow-emerald-900/10 hover:bg-[#095a31]",
        variant === "secondary" && "bg-[#D4AF37] text-[#241c06] hover:bg-[#c8a32f]",
        variant === "outline" && "border border-slate-200 bg-white text-[#142019] hover:border-[#0B6B3A]/40 hover:text-[#0B6B3A]",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-[#0B6B3A]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "success" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
        size === "sm" && "px-3 py-2 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" label="Working" /> : null}
      {children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: string;
};

export function Field({ label, helper, className, ...props }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className={cn(
          "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#142019] outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10",
          className
        )}
        {...props}
      />
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

type PasswordFieldProps = Omit<FieldProps, "type">;

export function PasswordField({ label, helper, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <input
          className={cn(
            "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-24 text-sm text-[#142019] outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10",
            className
          )}
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B6B3A] transition hover:bg-[#0B6B3A]/10"
          type="button"
          onClick={() => setVisible((previous) => !previous)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helper?: string;
};

export function TextareaField({ label, helper, className, ...props }: TextareaFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        className={cn(
          "min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#142019] outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10",
          className
        )}
        {...props}
      />
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
};

export function SelectField({ label, children, className, ...props }: SelectFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        className={cn(
          "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#142019] outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70", className)}>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "gold" | "green" | "red";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-slate-100 text-slate-600",
        tone === "primary" && "bg-[#0B6B3A]/10 text-[#0B6B3A]",
        tone === "gold" && "bg-[#D4AF37]/20 text-[#7b6112]",
        tone === "green" && "bg-emerald-100 text-emerald-700",
        tone === "red" && "bg-red-100 text-red-700",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<UserProfile, "fullName" | "photoUrl">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const generatedAvatar = !user.photoUrl || user.photoUrl.includes("ui-avatars.com");
  const sizeClasses = cn(
    size === "sm" && "h-9 w-9 text-xs",
    size === "md" && "h-12 w-12 text-sm",
    size === "lg" && "h-16 w-16 text-lg",
    size === "xl" && "h-24 w-24 text-2xl"
  );

  if (generatedAvatar) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B6B3A] to-[#13965a] font-heading font-bold text-white shadow-sm ring-2 ring-white",
          sizeClasses,
          className
        )}
        aria-label={`${user.fullName} profile initials`}
        title={user.fullName}
      >
        {getInitials(user.fullName)}
      </div>
    );
  }

  return (
    <img
      className={cn(
        "shrink-0 rounded-full object-cover ring-2 ring-white",
        sizeClasses,
        className
      )}
      src={user.photoUrl}
      alt={`${user.fullName} profile`}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
      <svg className="mx-auto mb-4 h-28 w-28 text-[#0B6B3A]/70" viewBox="0 0 160 120" fill="none" aria-hidden="true">
        <rect x="30" y="28" width="100" height="64" rx="18" fill="currentColor" opacity="0.12" />
        <circle cx="63" cy="60" r="14" fill="currentColor" opacity="0.22" />
        <path d="M43 88c8-16 32-16 40 0" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M94 52h26M94 68h18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M27 42c-10 7-13 19-7 30" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round" />
        <path d="M133 78c10-7 13-19 7-30" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <h3 className="font-heading text-lg font-semibold text-[#142019]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-2xl", className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-5">
        <SkeletonBlock className="h-44" />
        <SkeletonBlock className="h-80" />
      </div>
      <div className="space-y-5">
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-48" />
      </div>
    </div>
  );
}

export function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0B6B3A] text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/20">
        <span className="font-heading text-xl font-bold">K</span>
      </div>
      <div>
        <p className="font-heading text-lg font-bold text-[#0B6B3A]">Konnekt</p>
        <p className="text-xs text-slate-500">Professional network</p>
      </div>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</p>;
}

export function SuccessMessage({ message }: { message: string }) {
  return <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-heading text-xl font-bold text-[#142019]">{title}</h2>
      {action}
    </div>
  );
}

export function InfoLine({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FAF9] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"><Icon name={icon} className="h-4 w-4 text-[#0B6B3A]" />{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-[#142019]">{value}</p>
    </div>
  );
}

export function SuspendedScreen({ onLogout }: { onLogout: () => Promise<void> }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF9] p-6 text-[#142019]">
      <Panel className="max-w-xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <Icon name="shield" className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold">Account suspended</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Your Konnekt account has been suspended by a platform administrator. If you believe this is a mistake, contact hello@konnekt.africa.</p>
        <Button className="mt-6" variant="danger" onClick={() => void onLogout()}>Logout</Button>
      </Panel>
    </div>
  );
}

export function StatusLine({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAF9] px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <Badge tone={active ? "green" : "gold"}>{active ? activeText : inactiveText}</Badge>
    </div>
  );
}

export function AdminStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 font-heading text-3xl font-bold text-[#0B6B3A]">{value}</p>
    </div>
  );
}

export function AnalyticsPanel({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 font-heading text-2xl font-bold text-[#142019]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}
