import { log } from "@graphprotocol/graph-ts"
import {
  EngageChallenge,
  EventCancelled,
  ExitEvent,
  ResolveEvent,
  MarketMetadataSet, // On importe le type de l'événement manquant
} from "../generated/templates/MakaoFixture/MakaoFixture"

// === HANDLERS SQUELETTES POUR CHAQUE ÉVÉNEMENT ===
// Ils ne font que logger un message pour l'instant. Cela nous permet de déployer avec succès.
// Nous ajouterons la logique métier plus tard, une fois la base stable.

export function handleEngageChallenge(event: EngageChallenge): void {
  log.info("handleEngageChallenge appelé pour le marché : {}", [
    event.address.toHexString(),
  ])
  // TODO: Implémenter la logique pour les paris
}

export function handleEventCancelled(event: EventCancelled): void {
  log.info("handleEventCancelled appelé pour le marché : {}", [
    event.address.toHexString(),
  ])
  // TODO: Implémenter la logique pour l'annulation
}

export function handleExitEvent(event: ExitEvent): void {
  log.info("handleExitEvent appelé pour le marché : {}", [
    event.address.toHexString(),
  ])
  // TODO: Implémenter la logique pour les retraits
}

export function handleResolveEvent(event: ResolveEvent): void {
  log.info("handleResolveEvent appelé pour le marché : {}", [
    event.address.toHexString(),
  ])
  // TODO: Implémenter la logique pour la résolution
}

// === LA FONCTION MANQUANTE, AJOUTÉE ICI ===
export function handleMarketMetadataSet(event: MarketMetadataSet): void {
  log.info("handleMarketMetadataSet appelé pour le marché : {}", [
    event.address.toHexString(),
  ])
  // TODO: Implémenter la logique pour la mise à jour des métadonnées IPFS
}
