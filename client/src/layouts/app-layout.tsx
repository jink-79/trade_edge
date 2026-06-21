import { Outlet } from "react-router-dom";

import { Sidebar } from "./side-bar";
import { Topbar } from "./top-bar";

export default function AppLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
