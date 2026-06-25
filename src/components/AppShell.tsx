import type { ReactNode } from "react";
import type { IconName, UserProfile } from "@/types";
import { cn } from "@/utils/cn";
import { isAdminUser, isNavigationActive, pageTitle } from "@/utils/helpers";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { Avatar, Button, LogoMark } from "./ui";

function NavButton({
  item,
  active,
  onClick,
}: {
  item: { label: string; path: string; icon: IconName };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active ? "bg-[#0B6B3A] text-white shadow-lg shadow-emerald-900/10" : "text-slate-600 hover:bg-[#F8FAF9] hover:text-[#0B6B3A]"
      )}
      type="button"
      onClick={onClick}
    >
      <Icon name={item.icon} />
      {item.label}
    </button>
  );
}

export function AppShell({
  currentUser,
  unreadNotifications,
  onLogout,
  children,
}: {
  currentUser: UserProfile;
  unreadNotifications: number;
  onLogout: () => Promise<void>;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const navigationItems = [
    { label: "Home", mobileLabel: "Home", path: "/", icon: "home" as IconName },
    { label: "Network", mobileLabel: "Network", path: "/network", icon: "network" as IconName },
    { label: "Opportunities", mobileLabel: "Opps", path: "/opportunities", icon: "briefcase" as IconName },
    { label: "Messages", mobileLabel: "Chat", path: "/messages", icon: "message" as IconName },
    { label: "Profile", mobileLabel: "Profile", path: `/profile/${currentUser.id}`, icon: "user" as IconName },
  ];

  const settingsItem = { label: "Settings", mobileLabel: "Settings", path: "/settings", icon: "settings" as IconName };
  const adminItem = isAdminUser(currentUser) ? [{ label: "Admin", path: "/admin", icon: "admin" as IconName }] : [];
  const allItems = [...navigationItems, settingsItem, ...adminItem];
  const mobileItems = navigationItems;
  const pwaInstall = usePwaInstallPrompt();
  const handleInstallClick = async () => {
    if (pwaInstall.canInstall) {
      await pwaInstall.installApp();
      return;
    }
    window.alert("To install Konnekt, open your browser menu and choose Install app or Add to Home screen.");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#142019]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl lg:flex">
        <LogoMark />
        <nav className="mt-10 flex flex-1 flex-col gap-2">
          {allItems.map((item) => (
            <NavButton key={item.path} item={item} active={isNavigationActive(path, item.path)} onClick={() => navigate(item.path)} />
          ))}
        </nav>
        <div className="rounded-3xl bg-[#F8FAF9] p-4">
          <div className="flex items-center gap-3">
            <Avatar user={currentUser} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#142019]">{currentUser.fullName}</p>
              <p className="truncate text-xs text-slate-500">{currentUser.professionalTitle}</p>
            </div>
          </div>
          <Button className="mt-4 w-full" variant="ghost" onClick={() => void onLogout()}>
            <Icon name="logout" /> Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#F8FAF9]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white">
                <span className="font-heading text-xl font-bold">K</span>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-[#0B6B3A]">Konnekt</p>
                <p className="text-xs text-slate-500">Professional network</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Konnekt</p>
              <h1 className="font-heading text-2xl font-bold text-[#142019]">{pageTitle(path)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="hidden h-11 items-center justify-center gap-2 rounded-2xl border border-[#0B6B3A]/20 bg-white px-3 text-sm font-bold text-[#0B6B3A] shadow-sm transition hover:bg-[#0B6B3A]/10 sm:flex"
                type="button"
                onClick={() => void handleInstallClick()}
              >
                <Icon name="plus" className="h-4 w-4" />
                Install
              </button>
              <button
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0B6B3A]",
                  path === "/settings" && "border-[#0B6B3A]/30 text-[#0B6B3A]"
                )}
                type="button"
                onClick={() => navigate("/settings")}
                aria-label="Settings"
              >
                <Icon name="settings" />
              </button>
              {isAdminUser(currentUser) ? (
                <button
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0B6B3A]",
                    path === "/admin" && "border-[#0B6B3A]/30 text-[#0B6B3A]"
                  )}
                  type="button"
                  onClick={() => navigate("/admin")}
                  aria-label="Admin panel"
                >
                  <Icon name="admin" />
                </button>
              ) : null}
              <button
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0B6B3A]",
                  path === "/notifications" && "border-[#0B6B3A]/30 text-[#0B6B3A]"
                )}
                type="button"
                onClick={() => navigate("/notifications")}
                aria-label="Notifications"
              >
                <Icon name="bell" />
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-bold text-[#241c06]">
                    {unreadNotifications}
                  </span>
                ) : null}
              </button>
              <button
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0B6B3A]",
                  path.startsWith("/messages") && "border-[#0B6B3A]/30 text-[#0B6B3A]"
                )}
                type="button"
                onClick={() => navigate("/messages")}
                aria-label="Messages"
              >
                <Icon name="message" />
              </button>
              <button className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:flex" type="button" onClick={() => navigate(`/profile/${currentUser.id}`)} aria-label="Profile">
                <Avatar user={currentUser} size="sm" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-36 sm:px-6 lg:px-8 lg:pb-10">
          <div className="animate-fade-soft">{children}</div>
        </main>
      </div>

      {isAdminUser(currentUser) ? (
        <button
          className={cn(
            "fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-[#241c06] shadow-xl shadow-slate-900/20 transition hover:bg-[#c8a32f] lg:hidden",
            path === "/admin" && "bg-[#0B6B3A] text-white"
          )}
          type="button"
          onClick={() => navigate("/admin")}
          aria-label="Open admin panel"
        >
          <Icon name="admin" className="h-5 w-5" />
          Admin
        </button>
      ) : null}

      <button
        className="fixed bottom-40 right-4 z-50 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#0B6B3A] shadow-xl shadow-slate-900/20 ring-1 ring-[#0B6B3A]/15 transition hover:bg-[#0B6B3A]/10 sm:hidden"
        type="button"
        onClick={() => void handleInstallClick()}
        aria-label="Install Konnekt app"
      >
        <Icon name="plus" className="h-5 w-5" />
        Install
      </button>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-1 pt-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileItems.map((item) => (
            <button
              key={item.path}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold leading-none transition duration-200",
                isNavigationActive(path, item.path)
                  ? "-translate-y-0.5 bg-[#0B6B3A] text-white shadow-lg shadow-emerald-900/20"
                  : "text-slate-500 hover:bg-slate-100 hover:text-[#0B6B3A]"
              )}
              type="button"
              onClick={() => navigate(item.path)}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="block w-full truncate text-center">{item.mobileLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
