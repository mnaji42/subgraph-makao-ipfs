import { CreateInstance as CreateInstanceEvent } from "../generated/MakaoFactory/MakaoFactory"
import { CreateInstance } from "../generated/schema"

export function handleCreateInstance(event: CreateInstanceEvent): void {
  let entity = new CreateInstance(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.instance = event.params.instance

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
