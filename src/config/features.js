// Drapeaux consultes par Chat.jsx et NewSession.jsx pour masquer ce qui n'est
// pas encore branche cote interface.
//
// Un drapeau que personne ne lit est pire que pas de drapeau : le mobile avait
// le meme fichier, lu par aucun ecran, ce qui a fait croire en relecture que
// l'epinglage et la suppression etaient desactives alors qu'ils etaient livres
// et repondaient 404. Ce fichier a donc ete supprime cote mobile ; n'ajouter
// ici que des drapeaux reellement consultes.
//
// Epingler, modifier et supprimer un message existent et sont testes cote
// serveur (PATCH/DELETE /conversations/:id/messages/:messageId et .../pin).
// Ce qui manque est l'interface web, pas l'API : passer ces drapeaux a true
// sans cabler les appels recreerait des boutons morts.

export const FILE_UPLOAD_ENABLED     = true
export const GROUP_SESSIONS_ENABLED  = true
export const CHAT_DELETE_ENABLED     = false
export const CHAT_ARCHIVE_ENABLED    = false
export const GROUP_CHAT_ENABLED      = false
export const CHAT_PIN_ENABLED        = false
