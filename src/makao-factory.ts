// src/makao-factory.ts - VERSION MINIMALE ET GARANTIE FONCTIONNELLE

// --- IMPORTS MINIMAUX ---
// On n'importe que ce dont on a strictement besoin.
import { BigInt, log } from "@graphprotocol/graph-ts"
import { CreateInstance as CreateInstanceEvent } from "../generated/MakaoFactory/MakaoFactory"
import { Market } from "../generated/schema"

// --- HANDLER MINIMAL ---
export function handleCreateInstance(event: CreateInstanceEvent): void {
  // On logue le début pour voir que le handler est bien appelé.
  log.info("--- Début du handler MINIMAL pour la transaction {} ---", [
    event.transaction.hash.toHexString(),
  ])

  // 1. Récupérer l'adresse du marché créé.
  let marketId = event.params.instance.toHexString()

  // 2. Créer la nouvelle entité Market avec son ID.
  let market = new Market(marketId)

  // 3. Remplir les champs OBLIGATOIRES définis dans le schéma.
  //    - 'owner' : on prend l'adresse de la personne qui a envoyé la transaction.
  //    - 'createdAt' : on prend le timestamp du bloc.
  market.owner = event.transaction.from
  market.createdAt = event.block.timestamp

  // 4. Sauvegarder l'entité. C'est tout.
  market.save()

  log.info("--- Marché minimal {} créé avec succès ---", [marketId])
}
