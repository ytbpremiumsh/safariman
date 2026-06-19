import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/peserta/reguler")({
  component: () => <Outlet />,
});
