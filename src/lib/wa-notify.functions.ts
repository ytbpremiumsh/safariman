import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendWaForEvent } from "./wa-notify.server";

const inputSchema = z.object({
  event: z.enum(["pendaftaran", "berkas", "essay"]),
  code: z
    .string()
    .trim()
    .min(4)
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, "kode tidak valid"),
});

export const notifyWaEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    return sendWaForEvent(data.event, data.code);
  });
