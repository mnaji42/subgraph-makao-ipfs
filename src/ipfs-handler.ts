import {
  log,
  json,
  Bytes,
  dataSource,
  JSONValueKind,
} from "@graphprotocol/graph-ts"
import { MarketMetadata, MarketEvent } from "../generated/schema"

export function handleIpfsContent(data: Bytes): void {
  let context = dataSource.context()
  let marketId = context.getString("marketId")
  log.info("Traitement du contenu IPFS pour le marché : {}", [marketId])

  let metadata = new MarketMetadata(marketId)
  metadata.market = marketId

  let jsonResult = json.try_fromBytes(data)
  if (jsonResult.isError) {
    log.warning("Erreur de parsing JSON (fichier invalide) pour le marché {}", [
      marketId,
    ])
    metadata.save()
    return
  }

  let jsonData = jsonResult.value.toObject()

  let nameValue = jsonData.get("name")
  if (nameValue && !nameValue.isNull()) {
    metadata.name = nameValue.toString()
  }

  let descriptionValue = jsonData.get("description")
  if (descriptionValue && !descriptionValue.isNull()) {
    metadata.description = descriptionValue.toString()
  }

  let imageValue = jsonData.get("image")
  if (imageValue && !imageValue.isNull()) {
    metadata.image = imageValue.toString()
  }

  let propertiesValue = jsonData.get("properties")
  if (
    propertiesValue &&
    !propertiesValue.isNull() &&
    propertiesValue.kind == JSONValueKind.OBJECT
  ) {
    let propertiesObj = propertiesValue.toObject()
    let eventsValue = propertiesObj.get("events")

    if (
      eventsValue &&
      !eventsValue.isNull() &&
      eventsValue.kind == JSONValueKind.ARRAY
    ) {
      let eventsArray = eventsValue.toArray()
      for (let i = 0; i < eventsArray.length; i++) {
        // On vérifie que chaque élément du tableau est bien un OBJET
        if (eventsArray[i].kind != JSONValueKind.OBJECT) continue
        let eventItem = eventsArray[i].toObject()
        let eventIdValue = eventItem.get("id")
        let eventNameValue = eventItem.get("name")
        let eventDescriptionValue = eventItem.get("description")
        // On vérifie que tous les champs requis existent, ne sont pas nuls ET sont du bon type
        if (
          eventIdValue &&
          !eventIdValue.isNull() &&
          eventIdValue.kind == JSONValueKind.NUMBER &&
          eventNameValue &&
          !eventNameValue.isNull() &&
          eventDescriptionValue &&
          !eventDescriptionValue.isNull()
        ) {
          // On peut maintenant convertir en toute sécurité
          let marketEventId =
            metadata.id + "-" + eventIdValue.toBigInt().toString()
          let marketEvent = new MarketEvent(marketEventId)
          marketEvent.marketMetadata = metadata.id
          marketEvent.eventId = eventIdValue.toBigInt()
          marketEvent.name = eventNameValue.toString()
          marketEvent.description = eventDescriptionValue.toString()
          // 'createdAt' devrait être ajouté ici si disponible dans le JSON

          marketEvent.save()
        }
      }
    }
  }
  // Sauvegarde finale de l'entité de métadonnées
  metadata.save()
  log.info("Métadonnées enfant pour le marché {} sauvegardées avec succès.", [
    marketId,
  ])
}
