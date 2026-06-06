export const appConfig = {
  name: "Infinite Discovery",
  demoName: "Enders First Demo",
  description: "A two-dimensional short-video discovery feed.",
  productionUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
} as const;
