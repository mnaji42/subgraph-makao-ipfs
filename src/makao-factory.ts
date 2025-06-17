import { BigInt, log, DataSourceContext } from "@graphprotocol/graph-ts"
import { CreateInstance as CreateInstanceEvent } from "../generated/MakaoFactory/MakaoFactory"
import { MakaoFixture as MakaoFixtureTemplate } from "../generated/templates"
import { MakaoFixture } from "../generated/templates/MakaoFixture/MakaoFixture"
import { Market, GlobalStat } from "../generated/schema"
import { IpfsContent as IpfsContentTemplate } from "../generated/templates"

function updateGlobalStats(
  isNewMarket: boolean,
  // volumeChange: BigInt,
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

  // globalStat.totalVolume = globalStat.totalVolume.plus(volumeChange)
  globalStat.lastUpdated = timestamp
  globalStat.save()
}

export function handleCreateInstance(event: CreateInstanceEvent): void {
  log.info("=== Création d'un nouveau marché : {} ===", [
    event.params.instance.toHexString(),
  ])
  let marketId = event.params.instance.toHexString()
  let market = new Market(marketId)

  // 1. Initialisation de base
  market.contractAddress = event.params.instance
  market.creator = event.transaction.from
  market.createdAt = event.block.timestamp

  // Initialisation avec des valeurs par défaut
  market.totalAmount = BigInt.fromI32(0)
  market.isCancelled = false
  market.isResolved = false
  // market.isMetadataSynced = false

  let contract = MakaoFixture.bind(event.params.instance)

  // 2. Lecture séquentielle des données publiques on-chain
  let ownerResult = contract.try_owner()
  if (!ownerResult.reverted) {
    market.owner = ownerResult.value
  }

  let stakeTokenResult = contract.try_stakeToken()
  if (!stakeTokenResult.reverted) {
    market.stakeToken = stakeTokenResult.value
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

  // 3. Lecture et traitement des données IPFS
  let ipfsHashResult = contract.try_ipfsMetadataHash()
  if (!ipfsHashResult.reverted) {
    let ipfsHash = ipfsHashResult.value
    market.ipfsHash = ipfsHash

    // 3. Création du contexte pour passer l'ID du marché
    let context = new DataSourceContext()
    context.setString("marketId", marketId)

    // 4. Déclenchement du template AVEC le contexte
    IpfsContentTemplate.createWithContext(ipfsHash, context)

    log.info(
      "Template IPFS déclenché pour le CID {} avec le contexte du marché {}",
      [ipfsHash, marketId]
    )
  } else {
    log.warning("Impossible de récupérer l'ipfsHash pour le marché {}", [
      marketId,
    ])
  }

  // 5. Sauvegarde finale et activation du template
  market.save()
  updateGlobalStats(true, event.block.timestamp)
  MakaoFixtureTemplate.create(event.params.instance)
}
