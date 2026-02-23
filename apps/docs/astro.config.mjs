import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightClientMermaid from "@pasqal-io/starlight-client-mermaid";

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightClientMermaid()],
      title: {
        en: "RRSB Docs",
        de: "RRSB Dokumentation",
      },
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        de: {
          label: "Deutsch",
          lang: "de",
        },
      },
      sidebar: [
        {
          label: "Overview",
          translations: { de: "Überblick" },
          items: [
            {
              label: "Welcome",
              translations: { de: "Willkommen" },
              slug: "overview/welcome",
            },
            {
              label: "Plan & Progress",
              translations: { de: "Plan & Fortschritt" },
              slug: "overview/plan",
            },
            {
              label: "Tech Stack: Old vs New",
              translations: { de: "Tech Stack: Alt vs Neu" },
              slug: "overview/tech-stack",
            },
          ],
        },
      ],
    }),
  ],
});
