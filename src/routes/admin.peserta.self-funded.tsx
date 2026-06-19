import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/peserta/self-funded")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/peserta/self-funded/pendaftaran" });
  },
});
