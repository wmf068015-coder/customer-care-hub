import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UserCheck,
  Smile,
  BookOpen,
  MessagesSquare,
  Ticket,
  Bot,
  Bell,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const nav = [
  { to: "/", label: "后台运营总览", icon: LayoutDashboard },
  { to: "/transfer", label: "转人工统计", icon: UserCheck },
  { to: "/satisfaction", label: "满意度评价", icon: Smile },
  { to: "/knowledge", label: "知识库管理", icon: BookOpen },
  { to: "/sessions", label: "对话审核入库", icon: MessagesSquare },
  { to: "/tickets", label: "ERP 工单入库", icon: Ticket },
] as const;

export function AdminLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-6 py-5 flex items-center gap-2 border-b border-sidebar-border">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">知识库后台</div>
            <div className="text-[11px] text-sidebar-foreground/60">Admin Console</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-elegant)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
          v1.0 · 客服知识后台
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-6">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索会话、工单、知识..." className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-md hover:bg-accent">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                A
              </div>
              <div className="text-sm">
                <div className="font-medium leading-tight">Admin</div>
                <div className="text-xs text-muted-foreground">管理员</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
