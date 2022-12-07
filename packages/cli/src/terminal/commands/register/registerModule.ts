import { MemoryNode } from '@xyo-network/node'
import { terminal } from 'terminal-kit'

import { newline } from '../../../lib'

export const registerModule = (_node: MemoryNode) => {
  newline()
  terminal.yellow('Register Module')
  newline()
  terminal.red('TODO')
  newline()
  return Promise.resolve()
}
