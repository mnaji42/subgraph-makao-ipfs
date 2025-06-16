import { BigInt, log } from "@graphprotocol/graph-ts"
import { CreateInstance as CreateInstanceEvent } from "../generated/MakaoFactory/MakaoFactory"
import { MakaoFixture as MakaoFixtureTemplate } from "../generated/templates"
import { MakaoFixture } from "../generated/templates/MakaoFixture/MakaoFixture"
import { Market, GlobalStat } from "../generated/schema"

export function handleCreateInstance(event: CreateInstanceEvent): void {
  log.info("=== Création d'un nouveau marché : {} ===", [
    event.params.instance.toHexString(),
  ])

  let marketId = event.params.instance.toHexString()
  let market = new Market(marketId)

  // Données blockchain de base
  market.contractAddress = event.params.instance
  market.creator = event.transaction.from
  market.createdAt = event.block.timestamp

  // Initialisation avec des valeurs par défaut
  market.totalAmount = BigInt.fromI32(0)
  market.isCancelled = false
  market.isResolved = false

  // Connexion au contrat pour récupérer les données
  let contract = MakaoFixture.bind(event.params.instance)

  // Appels sécurisés avec try_
  let ownerResult = contract.try_owner()
  if (!ownerResult.reverted) {
    market.owner = ownerResult.value
  } else {
    log.warning("Impossible de récupérer owner pour {}", [marketId])
    market.owner = event.transaction.from
  }

  let stakeTokenResult = contract.try_stakeToken()
  if (!stakeTokenResult.reverted) {
    market.stakeToken = stakeTokenResult.value
  } else {
    log.error("Impossible de récupérer stakeToken pour {}", [marketId])
    return // Arrêt si donnée critique manquante
  }

  let engagementDeadlineResult = contract.try_engagementDeadline()
  if (!engagementDeadlineResult.reverted) {
    market.engagementDeadline = engagementDeadlineResult.value
  }

  let resolutionDeadlineResult = contract.try_resolutionDeadline()
  if (!resolutionDeadlineResult.reverted) {
    market.resolutionDeadline = resolutionDeadlineResult.value
  }

  let creatorFeeResult = contract.try_creatorFee()
  if (!creatorFeeResult.reverted) {
    market.creatorFee = creatorFeeResult.value
  }

  let predictionCountResult = contract.try_predictionCount()
  if (!predictionCountResult.reverted) {
    market.predictionCount = predictionCountResult.value
  }

  // Sauvegarde du marché
  market.save()

  // Mise à jour des statistiques globales
  updateGlobalStats(true, BigInt.fromI32(0), event.block.timestamp)

  // Activation du template pour écouter les événements du marché
  MakaoFixtureTemplate.create(event.params.instance)

  log.info("Marché {} créé avec succès", [marketId])
}

function updateGlobalStats(
  isNewMarket: boolean,
  volumeChange: BigInt,
  timestamp: BigInt
): void {
  let globalStat = GlobalStat.load("global")
  if (globalStat == null) {
    globalStat = new GlobalStat("global")
    globalStat.totalMarkets = BigInt.fromI32(0)
    globalStat.totalVolume = BigInt.fromI32(0)
    globalStat.totalUsers = BigInt.fromI32(0)
  }

  if (isNewMarket) {
    globalStat.totalMarkets = globalStat.totalMarkets.plus(BigInt.fromI32(1))
  }

  globalStat.totalVolume = globalStat.totalVolume.plus(volumeChange)
  globalStat.lastUpdated = timestamp
  globalStat.save()
}
