import { MemoryNode } from '@xyo-network/modules'

// export type NodeConfigurationFunction<TConfig = any, TResp = void> = (node: AbstractNode, config?: TConfig) => Promise<TResp>
export type NodeConfigurationFunction<T = void> = (node: MemoryNode) => Promise<T> | T