
import {
  LayoutDashboard,
  Mail,
  History,
  Settings,
  Send,
} from "lucide-react";

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

export default function Sidebar({
  activePage,
  onNavigate,
}: SidebarProps) {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Emails", icon: Mail },
    { name: "Email History", icon: History },
    { name: "Settings", icon: Settings },
  ];

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-[#0b1120] p-5 text-slate-300">
      <div className="mb-10 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-600 p-2">
          <Send size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white">MailFlow</h1>
          <p className="text-xs text-slate-500">Email Scheduler</p>
        </div>
      </div>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Workspace
      </p>

      <nav className="space-y-2">
        {menuItems.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onNavigate(name)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
              activePage === name
                ? "bg-indigo-600/15 font-semibold text-indigo-400 ring-1 ring-indigo-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon size={19} />
            {name}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-medium text-white">Email automation</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Manage scheduled emails and track their status.
        </p>
      </div>
    </aside>
  );
}
