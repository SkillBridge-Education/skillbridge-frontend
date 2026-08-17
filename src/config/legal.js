// src/config/legal.js
// Point unique pour les informations légales et les canaux de contact.
//
// ⚠️ Les valeurs ci-dessous sont des PLACEHOLDERS. Le domaine `.example` est
// réservé par la RFC 2606 : il ne peut pas exister réellement, ce qui évite
// d'envoyer du courrier à un tiers par erreur.
// TODO(legal): remplacer par les coordonnées réelles de l'éditeur avant la mise
// en production, en même temps que les placeholders des pages légales.

export const SUPPORT_EMAIL  = 'support@skillbridge.example'
export const PRIVACY_EMAIL  = 'privacy@skillbridge.example'
export const REPORT_EMAIL   = 'moderation@skillbridge.example'

// Endpoints backend attendus mais NON IMPLÉMENTÉS côté serveur.
// Tant qu'ils n'existent pas, l'UI affiche un état « bientôt disponible »
// plutôt que d'appeler une route qui renverrait un 404.
// TODO(backend): implémenter puis brancher ces routes.
export const PENDING_ENDPOINTS = {
  exportData:     'GET  /users/me/export',      // RGPD art. 15 & 20
  deleteAccount:  'DELETE /users/me',           // RGPD art. 17
  preferences:    'PATCH /users/me/preferences',// notifications + confidentialité
  supportTicket:  'POST /support/tickets',
  report:         'POST /reports',
}

// Numéros d'urgence français — affichés sur les pages de signalement/assistance.
export const EMERGENCY_NUMBERS = ['17', '119', '3018']
