import { json, Bytes, dataSource, log } from "@graphprotocol/graph-ts"
import { Market, MarketEvent } from "../generated/schema"

export function handleMarketMetadata(content: Bytes): void {
  let context = dataSource.context()
  let marketId = context.getString("marketId")
  let ipfsHash = dataSource.stringParam()
  let blockTimestamp = context.getBigInt("blockTimestamp")

  log.info("Traitement des métadonnées IPFS {} pour le marché {}", [
    ipfsHash,
    marketId,
  ])

  let market = Market.load(marketId)
  if (!market) {
    log.error("Marché {} non trouvé pour les métadonnées IPFS", [marketId])
    return
  }

  if (content === null) {
    log.warning("Données IPFS non disponibles pour {}", [ipfsHash])
    return
  }

  let jsonResult = json.try_fromBytes(content as Bytes)
  if (jsonResult.isError) {
    log.warning("Impossible de parser le JSON IPFS pour {}", [ipfsHash])
    return
  }

  let jsonData = jsonResult.value.toObject()
  if (!jsonData) {
    log.warning("JSON IPFS vide pour {}", [ipfsHash])
    return
  }

  // Extraire les métadonnées principales
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

  // Traiter les événements imbriqués
  let propertiesValue = jsonData.get("properties")
  if (propertiesValue && !propertiesValue.isNull()) {
    let properties = propertiesValue.toObject()
    if (properties) {
      let eventsValue = properties.get("events")
      if (eventsValue && !eventsValue.isNull()) {
        let eventsArray = eventsValue.toArray()
        for (let i = 0; i < eventsArray.length; i++) {
          let eventData = eventsArray[i].toObject()
          if (!eventData) continue

          let eventIdValue = eventData.get("id")
          let eventNameValue = eventData.get("name")
          let eventDescriptionValue = eventData.get("description")

          if (
            eventIdValue &&
            !eventIdValue.isNull() &&
            eventNameValue &&
            !eventNameValue.isNull() &&
            eventDescriptionValue &&
            !eventDescriptionValue.isNull()
          ) {
            let marketEventId =
              marketId + "-" + eventIdValue.toBigInt().toString()
            let marketEvent = new MarketEvent(marketEventId)
            marketEvent.market = marketId
            marketEvent.eventId = eventIdValue.toBigInt()
            marketEvent.name = eventNameValue.toString()
            marketEvent.description = eventDescriptionValue.toString()

            // CORRECTION: Utilisation du timestamp récupéré du contexte
            marketEvent.createdAt = blockTimestamp

            marketEvent.save()
          }
        }
      }
    }
  }

  market.save()
  log.info("Métadonnées IPFS traitées avec succès pour le marché {}", [
    marketId,
  ])
}
