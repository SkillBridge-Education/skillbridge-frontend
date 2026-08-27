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
//
// ⚠️ Cette liste est dangereuse quand elle est fausse. Elle a longtemps
// annoncé /users/me/export et DELETE /users/me comme manquants alors que les
// deux existaient et fonctionnaient : l'interface affichait donc « bientôt
// disponible » sur les droits d'accès, de portabilité et d'effacement que le
// RGPD garantit. Une note périmée a coûté des droits réels.
//
// Ne rien ajouter ici sans avoir vérifié la route sur le serveur en cours.
export const PENDING_ENDPOINTS = {
  preferences: 'PATCH /users/me/preferences', // notifications + confidentialité
}

// Implémentés et branchés : POST /reports, /blocks, /appeals,
// /organizations/requests, /support/tickets, GET /users/me/export,
// DELETE /users/me, POST /sessions/:id/cancel (voir services/api.js).

// Numéros d'urgence français — affichés sur les pages de signalement/assistance.
export const EMERGENCY_NUMBERS = ['17', '119', '3018']
