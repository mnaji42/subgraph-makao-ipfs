// src/market.ts
import { BigInt, log, dataSource } from "@graphprotocol/graph-ts"
import {
  EngageChallenge,
  EventCancelled,
  ExitEvent,
  ResolveEvent,
  MarketMetadataSet,
} from "../generated/templates/MakaoFixture/MakaoFixture"
import { MarketMetadata } from "../generated/templates"
import { Market, Engagement, GlobalStat } from "../generated/schema"

export function handleEngageChallenge(event: EngageChallenge): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)

  if (!market) {
    log.error("Marché {} non trouvé pour EngageChallenge", [marketId])
    return
  }

  // Créer l'engagement
  let engagementId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let engagement = new Engagement(engagementId)

  engagement.market = marketId
  engagement.user = event.params.user
  engagement.amount = event.params.amount
  engagement.timestamp = event.block.timestamp
  engagement.transactionHash = event.transaction.hash
  engagement.save()

  // Mettre à jour le marché
  market.totalAmount = market.totalAmount.plus(event.params.amount)
  market.save()

  // Mettre à jour les stats globales
  updateGlobalStats(false, event.params.amount, event.block.timestamp)

  log.info("Engagement {} créé pour le marché {}", [engagementId, marketId])
}

export function handleEventCancelled(event: EventCancelled): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)

  if (!market) {
    log.error("Marché {} non trouvé pour EventCancelled", [marketId])
    return
  }

  market.isCancelled = true
  market.save()

  log.info("Marché {} annulé", [marketId])
}

export function handleExitEvent(event: ExitEvent): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)

  if (!market) {
    log.error("Marché {} non trouvé pour ExitEvent", [marketId])
    return
  }

  // Réduire le montant total
  market.totalAmount = market.totalAmount.minus(event.params.amount)
  market.save()

  log.info("Sortie de {} du marché {}", [
    event.params.amount.toString(),
    marketId,
  ])
}

export function handleResolveEvent(event: ResolveEvent): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)

  if (!market) {
    log.error("Marché {} non trouvé pour ResolveEvent", [marketId])
    return
  }

  market.isResolved = true
  market.save()

  log.info("Marché {} résolu", [marketId])
}

export function handleMarketMetadataSet(event: MarketMetadataSet): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)

  if (!market) {
    log.error("Marché {} non trouvé pour MarketMetadataSet", [marketId])
    return
  }

  // Stocker le hash IPFS
  market.ipfsHash = event.params.ipfsHash
  market.save()

  // Déclencher la récupération des métadonnées IPFS avec contexte
  let context = new dataSource.DataSourceContext()
  context.setString("marketId", marketId)
  MarketMetadata.createWithContext(event.params.ipfsHash, context)

  log.info("Métadonnées IPFS {} liées au marché {}", [
    event.params.ipfsHash,
    marketId,
  ])
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
