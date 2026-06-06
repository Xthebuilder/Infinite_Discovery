import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_MSW: z.preprocess(emptyStringToUndefined, z.enum(["off"]).optional()),
  NEXT_PUBLIC_POSTHOG_HOST: z.preprocess(
    emptyStringToUndefined,
    z.string().url().optional(),
  ),
  NEXT_PUBLIC_POSTHOG_KEY: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_MSW: process.env.NEXT_PUBLIC_MSW,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
});
