import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/peserta/self-funded")({
  component: () => <Outlet />,
});
