import { XyoDomainPayload } from './Payload'

export const domainConfigTemplate = (): XyoDomainPayload => ({
  aliases: {
    'com.example.id': {
      huri: '',
    },
  },
  networks: [
    {
      name: '',
      nodes: [
        {
          name: '',
          schema: 'network.xyo.network.node',
          slug: '',
          type: 'archivist',
          uri: '',
        },
      ],
      schema: 'network.xyo.network',
      slug: '',
    },
  ],
  schema: 'network.xyo.domain',
})