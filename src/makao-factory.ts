import { BigInt, log, ipfs, json, Bytes } from "@graphprotocol/graph-ts"
import { CreateInstance as CreateInstanceEvent } from "../generated/MakaoFactory/MakaoFactory"
import { MakaoFixture as MakaoFixtureTemplate } from "../generated/templates"
import { MakaoFixture } from "../generated/templates/MakaoFixture/MakaoFixture"
import { Market, GlobalStat } from "../generated/schema"

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

  // Données blockchain de base
  market.contractAddress = event.params.instance
  market.creator = event.transaction.from
  market.createdAt = event.block.timestamp

  // Initialisation avec des valeurs par défaut
  market.totalAmount = BigInt.fromI32(0)
  market.isCancelled = false
  market.isResolved = false

  let contract = MakaoFixture.bind(event.params.instance)

  // 2. Lecture de toutes les données publiques on-chain
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

  // --- LA LOGIQUE IPFS SIMPLIFIÉE ---
  // 3. Lecture directe du hash IPFS public
  let ipfsHashResult = contract.try_ipfsMetadataHash()
  if (!ipfsHashResult.reverted) {
    let ipfsHash = ipfsHashResult.value
    market.ipfsHash = ipfsHash // On sauvegarde le hash
    log.info("Hash IPFS trouvé pour le marché {}: {}", [marketId, ipfsHash])

    // 4. Fetch des données depuis IPFS
    let data = ipfs.cat(ipfsHash)
    if (data) {
      log.info("Données IPFS récupérées pour {}", [ipfsHash])
      let jsonResult = json.try_fromBytes(data as Bytes)
      if (!jsonResult.isError) {
        let jsonData = jsonResult.value.toObject()
        if (jsonData) {
          // 5. Parsing et assignation des métadonnées
          let nameValue = jsonData.get("name")
          if (nameValue && !nameValue.isNull()) {
            market.name = nameValue.toString()
          }

          let descriptionValue = jsonData.get("description")
          if (descriptionValue && !descriptionValue.isNull()) {
            market.description = descriptionValue.toString()
          }

          let imageValue = jsonData.get("image")
          if (imageValue && !imageValue.isNull()) {
            market.image = imageValue.toString()
          }

          // Traitement des événements imbriqués
          let propertiesValue = jsonData.get("properties")
          if (propertiesValue && !propertiesValue.isNull()) {
            let properties = propertiesValue.toObject()
            if (properties) {
              let eventsValue = properties.get("events")
              if (eventsValue && !eventsValue.isNull()) {
                let eventsArray = eventsValue.toArray()
                for (let i = 0; i < eventsArray.length; i++) {
                  // ... (logique pour créer les MarketEvent)
                }
              }
            }
          }
        }
      } else {
        log.warning("Erreur de parsing JSON pour {}", [ipfsHash])
      }
    } else {
      log.warning("Impossible de récupérer les données IPFS pour {}", [
        ipfsHash,
      ])
    }
  } else {
    log.warning("Impossible de récupérer ipfsMetadataHash pour le marché {}", [
      marketId,
    ])
  }

  // 6. Sauvegarde finale et activation du template
  market.save()
  updateGlobalStats(true, event.block.timestamp)
  MakaoFixtureTemplate.create(event.params.instance)
  log.info("Marché {} traité et sauvegardé.", [marketId])
}
