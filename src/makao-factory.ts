// src/makao-factory.ts - Étape 2 : Enrichissement

// --- IMPORTS ---
import { BigInt, log } from "@graphprotocol/graph-ts"
import { CreateInstance as CreateInstanceEvent } from "../generated/MakaoFactory/MakaoFactory"
import { MakaoFixture as MakaoFixtureTemplate } from "../generated/templates"
import { MakaoFixture } from "../generated/templates/MakaoFixture/MakaoFixture"
import { Market } from "../generated/schema"

// --- HANDLER ENRICHI ---
export function handleCreateInstance(event: CreateInstanceEvent): void {
  log.info("--- Début du handler ENRICHI pour la transaction {} ---", [
    event.transaction.hash.toHexString(),
  ])

  // 1. Récupérer l'adresse du marché créé.
  let marketId = event.params.instance.toHexString()

  // 2. ÉTAPE CLÉ : Dire au subgraph de commencer à écouter ce nouveau marché.
  // C'est ce qui active le template défini dans subgraph.yaml.
  MakaoFixtureTemplate.create(event.params.instance)

  // 3. Créer la nouvelle entité Market avec son ID.
  let market = new Market(marketId)
  market.createdAt = event.block.timestamp

  // 4. Se connecter au contrat du marché pour lire ses informations.
  let contract = MakaoFixture.bind(event.params.instance)

  // 5. Utiliser `try_` pour appeler les fonctions du contrat en toute sécurité.
  // Cela évite que le subgraph ne crash si un appel échoue.
  let ownerResult = contract.try_owner()
  let stakeTokenResult = contract.try_stakeToken()
  let engagementDeadlineResult = contract.try_engagementDeadline()
  let resolutionDeadlineResult = contract.try_resolutionDeadline()
  let creatorFeeResult = contract.try_creatorFee()
  let predictionCountResult = contract.try_predictionCount()

  // 6. Remplir les champs de l'entité avec les résultats.
  if (!ownerResult.reverted) {
    market.owner = ownerResult.value
  } else {
    // Si l'appel échoue, on met une valeur par défaut.
    market.owner = event.transaction.from
  }

  if (!stakeTokenResult.reverted) {
    market.stakeToken = stakeTokenResult.value
  }

  if (!engagementDeadlineResult.reverted) {
    market.engagementDeadline = engagementDeadlineResult.value
  }

  if (!resolutionDeadlineResult.reverted) {
    market.resolutionDeadline = resolutionDeadlineResult.value
  }

  if (!creatorFeeResult.reverted) {
    market.creatorFee = creatorFeeResult.value
  }

  if (!predictionCountResult.reverted) {
    market.predictionCount = predictionCountResult.value
  }

  // 7. Initialiser les autres champs.
  market.totalAmount = BigInt.fromI32(0)
  market.isCancelled = false
  market.isResolved = false

  // 8. Sauvegarder l'entité enrichie.
  market.save()

  log.info("--- Marché enrichi {} créé avec succès ---", [marketId])
}
