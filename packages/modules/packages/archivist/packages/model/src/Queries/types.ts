import { ModuleQuery, ModuleQueryBase, Query } from '@xyo-network/module-model'

import { ArchivistAllQuery } from './All'
import { ArchivistClearQuery } from './Clear'
import { ArchivistCommitQuery } from './Commit'
import { ArchivistDeleteQuery } from './Delete'
import { ArchivistFindQuery } from './Find'
import { ArchivistGetQuery } from './Get'
import { ArchivistInsertQuery } from './Insert'

export type ArchivistQueryRoot =
  | ArchivistAllQuery
  | ArchivistClearQuery
  | ArchivistCommitQuery
  | ArchivistDeleteQuery
  | ArchivistFindQuery
  | ArchivistGetQuery
  | ArchivistInsertQuery

export type ArchivistQueries = ModuleQueryBase | ArchivistQueryRoot

export type ArchivistQuery<TQuery extends Query | void = void> = ModuleQuery<TQuery extends Query ? ArchivistQueryRoot | TQuery : ArchivistQueryRoot>
