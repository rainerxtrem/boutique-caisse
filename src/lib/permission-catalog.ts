export type PermissionCategory =
  | "Aperçu"
  | "Vente"
  | "Clients"
  | "Catalogue"
  | "Marketing"
  | "Administration";

export type PermissionDef = {
  key: string;
  label: string;
  category: PermissionCategory;
};

/** Source of truth for every permission the app understands. Seeded into the DB by the roles_and_permissions migration. */
export const PERMISSIONS: PermissionDef[] = [
  { key: "dashboard.view", label: "Voir le tableau de bord", category: "Aperçu" },
  { key: "statistiques.view", label: "Voir les statistiques", category: "Aperçu" },
  { key: "statistiques.export", label: "Exporter les statistiques (CSV)", category: "Aperçu" },
  { key: "caisse.use", label: "Utiliser la caisse (encaisser)", category: "Vente" },
  { key: "caisse.cloture", label: "Clôturer la caisse", category: "Vente" },
  { key: "caisse.retours", label: "Traiter les retours en caisse", category: "Vente" },
  { key: "commandes.view", label: "Voir les commandes web", category: "Vente" },
  { key: "commandes.manage", label: "Gérer les commandes web", category: "Vente" },
  { key: "commandes.refund", label: "Effectuer un remboursement", category: "Vente" },
  { key: "clients.view", label: "Voir les clients fidélité", category: "Clients" },
  { key: "clients.manage", label: "Créer/modifier/supprimer des clients", category: "Clients" },
  { key: "fidelite.manage_tiers", label: "Gérer les paliers fidélité", category: "Clients" },
  { key: "recompenses.manage", label: "Gérer les récompenses", category: "Clients" },
  { key: "recompenses.fulfill", label: "Remettre une récompense", category: "Clients" },
  { key: "articles.view", label: "Voir les articles", category: "Catalogue" },
  { key: "articles.manage", label: "Créer/modifier/désactiver des articles", category: "Catalogue" },
  { key: "fournisseurs.manage", label: "Gérer les fournisseurs", category: "Catalogue" },
  { key: "promotions.manage", label: "Gérer les codes promo", category: "Marketing" },
  { key: "bannieres.manage", label: "Gérer les bannières", category: "Marketing" },
  { key: "utilisateurs.manage", label: "Gérer les utilisateurs", category: "Administration" },
  { key: "roles.manage", label: "Gérer les rôles et permissions", category: "Administration" },
  { key: "audit.view", label: "Voir le journal d'audit", category: "Administration" },
];
