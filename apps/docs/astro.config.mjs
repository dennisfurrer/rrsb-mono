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
              link: "/",
            },
            {
              label: "Comparison: Old vs New",
              translations: { de: "Vergleich: Alt vs Neu" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Plan & Progress",
              translations: { de: "Plan & Fortschritt" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
          ],
        },
        {
          label: "Database",
          translations: { de: "Datenbank" },
          items: [
            {
              label: "Overview",
              translations: { de: "Überblick" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Data Model",
              translations: { de: "Datenmodell" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Migrations",
              translations: { de: "Migrationen" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Backups",
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Code",
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Reference / Links",
              translations: { de: "Referenz / Links" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
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
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Matches",
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Frame Actions",
              translations: { de: "Frame-Aktionen" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Players",
              translations: { de: "Spieler" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Breaks",
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Highlights",
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Code",
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Reference / Links",
              translations: { de: "Referenz / Links" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
          ],
        },
        {
          label: "Apps",
          items: [
            {
              label: "Scoreboard UI",
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Statistics UI",
              translations: { de: "Statistik UI" },
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
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
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
            {
              label: "Deployment",
              link: "#",
              attrs: { style: "pointer-events: none; opacity: 0.5;" },
            },
          ],
        },
      ],
    }),
  ],
});
