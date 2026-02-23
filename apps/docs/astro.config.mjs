import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mermaid from "astro-mermaid";

export default defineConfig({
  integrations: [
    mermaid(),
    starlight({
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
        {
          label: "Database",
          translations: { de: "Datenbank" },
          items: [
            {
              label: "Data Model",
              translations: { de: "Datenmodell" },
              slug: "database/data-model",
            },
            {
              label: "Migrations & Seeding",
              translations: { de: "Migrationen & Seeding" },
              slug: "database/migrations",
            },
          ],
        },
        {
          label: "API Reference",
          translations: { de: "API-Referenz" },
          items: [
            {
              label: "Overview",
              translations: { de: "Überblick" },
              slug: "api/overview",
            },
            {
              label: "Matches",
              slug: "api/matches",
            },
            {
              label: "Frame Actions",
              translations: { de: "Frame-Aktionen" },
              slug: "api/frame-actions",
            },
            {
              label: "Players",
              translations: { de: "Spieler" },
              slug: "api/players",
            },
            {
              label: "Breaks",
              slug: "api/breaks",
            },
            {
              label: "Highlights",
              slug: "api/highlights",
            },
          ],
        },
        {
          label: "Apps",
          items: [
            {
              label: "Scoreboard UI",
              slug: "apps/scoreboard-ui",
            },
            {
              label: "Statistics UI",
              translations: { de: "Statistik UI" },
              slug: "apps/statistics-ui",
            },
          ],
        },
        {
          label: "Operations",
          translations: { de: "Betrieb" },
          items: [
            {
              label: "Running Locally",
              translations: { de: "Lokal starten" },
              slug: "operations/running-locally",
            },
            {
              label: "Deployment",
              slug: "operations/deployment",
            },
          ],
        },
      ],
    }),
  ],
});
