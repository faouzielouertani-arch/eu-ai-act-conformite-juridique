# Serveur MCP EU AI Act — fork personnel

Fork du projet [lexbeam-software/eu-ai-act-mcp](https://github.com/lexbeam-software/eu-ai-act-mcp) (MIT), utilisé comme outil d'analyse de conformité IA Act.

## Usage

Serveur MCP donnant aux agents une intelligence structurée sur le règlement (UE) 2024/1689 tel que modifié par le règlement (UE) 2026/1744 (Digital Omnibus, en vigueur le 27 juillet 2026) :

- `euaiact_classify_system` — classification du niveau de risque (interdit / haut risque / limité / minimal)
- `euaiact_assess_system` — évaluation bornée en trois blocs (classification, impact, préparation)
- `euaiact_article` — recherche d'article avec citations EUR-Lex stables
- `euaiact_deadlines` — échéances (omnibus intégré)
- `euaiact_obligations`, `euaiact_penalties`, `euaiact_faq` — obligations, sanctions, FAQ
- `euaiact_gpai_systemic` — risque systémique GPAI (seuil 10^25 FLOPs)
- `euaiact_annex_iv` — checklist annexe IV

Endpoint public direct (sans clé) : https://mcp.lexbeam.com/mcp — contrôle de santé : /health.
Installation locale : `npx -y @lexbeam-software/eu-ai-act-mcp`

## Personnalisations locales

Deux outils ajoutés le 15/09/2026 (absents de l'amont) :

- `regulatory-watch` — veille réglementaire
- `compliance-monitor` — monitoring de conformité

## Synchronisation amont

- Base : v1.5.0 (14/08/2026, commit a574dd9)
- Correctif 1.5.1 appliqué le 18/09/2026 via la branche sync-1.5.1 (PR #1) : correction d'une URL morte émise par `euaiact_classify_system`
- Règle : synchroniser par fusion chirurgicale en préservant les outils personnalisés ; ne jamais écraser `regulatory-watch` et `compliance-monitor`

## Limites constatées (audit du 18/09/2026)

- Le serveur fournit des synthèses organisées et des classificateurs, pas l'intégralité du règlement ni les normes harmonisées ni les procédures nationales.
- Historique de régressions corrigées (20 défauts adjudiqués en 1.4.4) : re-vérifier la justesse à chaque version.
- Petit projet, faible revue communautaire : les réponses restent à vérifier contre les textes (EUR-Lex).
- Corpus : versions scellées du règlement (original, consolidé 27/07/2026, omnibus 2026/1744, proposition superseded 52025PC0836).

## Sécurité

Workflows gitleaks (secrets) et semgrep (analyse statique) ajoutés sur ce fork — absents de l'amont.

## Licence

Code amont : MIT (Lexbeam Software). Ce fork et sa documentation : usage personnel — ne pas diffuser sans autorisation.
