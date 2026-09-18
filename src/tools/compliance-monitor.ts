import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BRANDING } from "../constants.js";
import { getMilestonesWithDaysRemaining } from "../knowledge/deadlines.js";

const complianceMonitorInputSchema = {
  system_id: z.string().min(1).max(160).describe("Identifiant stable du système suivi (non stocké : rappelé en sortie)"),
  risk_tier: z
    .enum(["prohibited", "high-risk", "limited", "minimal", "undetermined"])
    .describe("Niveau de risque issu de euaiact_classify_system ou euaiact_assess_system"),
  obligations_done: z
    .array(z.string().min(1))
    .default([])
    .describe("Identifiants ou libellés d'obligations déjà remplies (ex: 'annex-iv-doc', 'art-13-risk-mgmt')"),
  obligations_pending: z
    .array(z.string().min(1))
    .default([])
    .describe("Obligations identifiées mais non encore remplies"),
};

export function registerComplianceMonitorTool(server: McpServer): void {
  server.registerTool(
    "euaiact_compliance_monitor",
    {
      title: "EU AI Act suivi de conformité",
      description:
        "Tableau de bord d'état de conformité d'un système d'IA suivi : taux de préparation à partir des obligations remplies/en attente, prochaine échéance réglementaire bloquante (jalons en vigueur et à venir de la base scellée), et recommandations prioritaires. Ne remplace pas euaiact_assess_system : c'est un suivi périodique fondé sur des entrées déclaratives.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: complianceMonitorInputSchema,
    },
    async (input: { system_id: string; risk_tier: string; obligations_done?: string[]; obligations_pending?: string[] }): Promise<{ content: any[]; structuredContent: any }> => {
      const done = input.obligations_done ?? [];
      const pending = input.obligations_pending ?? [];
      const total = done.length + pending.length;

      // Taux de préparation : 100 si aucune obligation déclarée, sinon ratio
      const readiness = total === 0 ? 100 : Math.round((done.length / total) * 100);

      // Prochaine échéance réglementaire à venir (non passée, statut en vigueur)
      const upcomingMilestones = getMilestonesWithDaysRemaining().filter(
        (m) => !m.isPast && m.status !== "proposal_only"
      );
      const blocking = upcomingMilestones.length > 0 ? upcomingMilestones[0] : null;

      // Recommandations — déterministes, fondées sur les entrées déclaratives
      const recommendations: string[] = [];
      if (input.risk_tier === "undetermined") {
        recommendations.push("Niveau de risque non déterminé : exécuter euaiact_classify_system avec les signaux structurés du système avant tout suivi.");
      }
      if (input.risk_tier === "prohibited") {
        recommendations.push("Système classé interdit : la mise sur le marché est proscrite — vérifier art. 5 via euaiact_get_article avant toute autre démarche.");
      }
      if (pending.length > 0) {
        recommendations.push("Obligations en attente (" + pending.length + ") : prioriser celles liées aux jalons à moins de 90 jours via euaiact_regulatory_watch.");
      }
      if (input.risk_tier === "high-risk" && readiness < 100) {
        recommendations.push("Haut risque non prêt : les exigences de l'annexe I et la documentation de l'annexe IV conditionnent la mise en conformité — voir euaiact_annex_iv.");
      }
      if (blocking && blocking.daysRemaining <= 30) {
        recommendations.push("Échéance imminente (" + blocking.name + ", J-" + blocking.daysRemaining + ") : traiter en priorité les obligations associées.");
      }
      if (recommendations.length === 0) {
        recommendations.push("Aucune action prioritaire identifiée sur la base des entrées déclarées — maintien du suivi périodique recommandé.");
      }

      const output = {
        system_id: input.system_id,
        risk_tier: input.risk_tier,
        readiness_pct: readiness,
        obligations_done: done,
        obligations_pending: pending,
        blocking_deadline: blocking
          ? { date: blocking.date, name: blocking.name, days_remaining: blocking.daysRemaining }
          : null,
        recommendations,
        lexbeam_url: BRANDING.baseUrl + "/kontakt",
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );
}
