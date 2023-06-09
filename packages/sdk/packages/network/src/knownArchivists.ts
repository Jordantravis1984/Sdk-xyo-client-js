import { XyoNetworkNodePayload, XyoNetworkNodeSchema } from './XyoNetworkNodePayload'

const kerplunkArchivist = (): XyoNetworkNodePayload => {
  return {
    docs: 'https://beta.archivist.xyo.network/api',
    name: 'XYO Shared Archivist (kerplunk)',
    schema: XyoNetworkNodeSchema,
    slug: 'kerplunk',
    type: 'archivist',
    uri: 'https://beta.api.archivist.xyo.network',
    web: 'https://beta.archivist.xyo.network',
  }
}

const mainArchivist = (): XyoNetworkNodePayload => {
  return {
    docs: 'https://archivist.xyo.network/api',
    name: 'XYO Shared Archivist (main)',
    schema: XyoNetworkNodeSchema,
    slug: 'main',
    type: 'archivist',
    uri: 'https://api.archivist.xyo.network',
    web: 'https://archivist.xyo.network',
  }
}

const localArchivist = (): XyoNetworkNodePayload => {
  return {
    docs: 'http://localhost:8080/api',
    name: 'XYO Shared Archivist (local)',
    schema: XyoNetworkNodeSchema,
    slug: 'local',
    type: 'archivist',
    uri: 'http://localhost:8080',
    web: 'http://localhost:8081',
  }
}

export const knownArchivists = (): XyoNetworkNodePayload[] => [kerplunkArchivist(), mainArchivist(), localArchivist()]
