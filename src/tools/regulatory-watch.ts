import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BRANDING } from "../constants.js";
import { getMilestonesWithDaysRemaining } from "../knowledge/deadlines.js";
import { omnibusStatusLine } from "../knowledge/digital-omnibus.js";

const regulatoryWatchInputSchema = {
  horizon_days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(90)
    .describe("Nombre de jours à couvrir vers l'avenir (1-365, défaut 90)"),
  include_in_effect: z
    .boolean()
    .default(false)
    .describe("Inclure aussi les jalons déjà en vigueur"),
};

export function registerRegulatoryWatchTool(server: McpServer): void {
  server.registerTool(
    "euaiact_regulatory_watch",
    {
      title: "EU AI Act veille réglementaire",
      description:
        "Veille sur les échéances du règlement (UE) 2024/1689 tel que modifié par le Digital Omnibus : jalons à venir dans un horizon donné (défaut 90 jours), statut de l'omnibus, et jalons déjà en vigueur sur demande. Source : base de connaissances scellée du serveur (deadlines.ts, digital-omnibus.ts).",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: regulatoryWatchInputSchema,
    },
    async (input: { horizon_days?: number; include_in_effect?: boolean }): Promise<{ content: any[]; structuredContent: any }> => {
      const horizon = input.horizon_days ?? 90;
      const includeInEffect = input.include_in_effect ?? false;

      const all = getMilestonesWithDaysRemaining();
      const now = new Date();

      // Jalons à venir dans l'horizon : non passés et à moins de N jours
      const upcoming = all
        .filter((m) => !m.isPast && m.daysRemaining <= horizon && m.status !== "proposal_only")
        .map((m) => ({
          date: m.date,
          name: m.name,
          description: m.description,
          articles: m.articles,
          key_obligations: m.keyObligations,
          days_remaining: m.daysRemaining,
        }));

      const inEffect = includeInEffect
        ? all
            .filter((m) => m.isPast || m.status === "in_effect")
            .map((m) => ({
              date: m.date,
              name: m.name,
              key_obligations: m.keyObligations,
            }))
        : [];

      const output = {
        as_of: now.toISOString().slice(0, 10),
        horizon_days: horizon,
        omnibus_status: omnibusStatusLine(),
        upcoming_milestones: upcoming,
        milestones_in_effect: inEffect,
        count_upcoming: upcoming.length,
        lexbeam_url: BRANDING.baseUrl + "/kontakt",
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );
}
