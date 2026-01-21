import { Daytona } from '@daytonaio/sdk'

let daytonaClient: Daytona | null = null

export function getDaytonaClient(): Daytona {
  if (!daytonaClient) {
    daytonaClient = new Daytona()
  }
  return daytonaClient
}
