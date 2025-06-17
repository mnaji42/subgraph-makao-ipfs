import { log, json, Bytes, dataSource } from "@graphprotocol/graph-ts"

import { MarketMetadata, MarketEvent } from "../generated/schema"

export function handleIpfsContent(data: Bytes): void {
  // 1. Récupération du contexte que nous avons passé
  let context = dataSource.context()
  let marketId = context.getString("marketId")
  log.info("Traitement du contenu IPFS pour le marché : {}", [marketId])

  // 2. Chargement de l'entité 'Market' existante
  let metadata = new MarketMetadata(marketId)

  // 3. Parsing du JSON
  let jsonResult = json.try_fromBytes(data)
  if (!jsonResult.isError) {
    let jsonData = jsonResult.value.toObject()

    let nameValue = jsonData.get("name")
    if (nameValue) metadata.name = nameValue.toString()

    let descriptionValue = jsonData.get("description")
    if (descriptionValue) metadata.description = descriptionValue.toString()

    let imageValue = jsonData.get("image")
    if (imageValue && !imageValue.isNull()) {
      metadata.image = imageValue.toString()
    }

    // Nouvelle logique pour parser les événements à partir de jsonData
    let propertiesValue = jsonData.get("properties")
    if (propertiesValue && !propertiesValue.isNull()) {
      let propertiesObj = propertiesValue.toObject()
      let eventsValue = propertiesObj.get("events")
      if (eventsValue && !eventsValue.isNull()) {
        let eventsArray = eventsValue.toArray()
        for (let i = 0; i < eventsArray.length; i++) {
          let eventItem = eventsArray[i].toObject()
          let eventIdValue = eventItem.get("id")
          let eventNameValue = eventItem.get("name")
          let eventDescriptionValue = eventItem.get("description")

          if (eventIdValue && eventNameValue && eventDescriptionValue) {
            let marketEventId = metadata.id + "-" + eventIdValue.toString()
            let marketEvent = new MarketEvent(marketEventId)
            marketEvent.marketMetadata = metadata.id
            marketEvent.eventId = eventIdValue.toBigInt()
            marketEvent.name = eventNameValue.toString()
            marketEvent.description = eventDescriptionValue.toString()
            // marketEvent.createdAt = metadata.createdAt
            marketEvent.save()
            log.info("MarketEvent créé: {}", [marketEventId])
          } else {
            log.warning("Données MarketEvent incomplètes pour le marché {}", [
              metadata.id,
            ])
          }
        }
      } else {
        log.warning(
          "La propriété 'events' est manquante ou nulle dans les propriétés IPFS pour le marché {}",
          [metadata.id]
        )
      }
    } else {
      log.warning(
        "La propriété 'properties' est manquante ou nulle dans les données IPFS pour le marché {}",
        [metadata.id]
      )
    }

    // metadata.isMetadataSynced = true

    log.info("Marché {} enrichi avec succès depuis IPFS.", [marketId])
  } else {
    log.warning(
      "Erreur de parsing JSON pour le marché {}. Les métadonnées ne seront pas ajoutées.",
      [marketId]
    )
  }

  // 4. Sauvegarde finale du marché enrichi
  metadata.save()
}
