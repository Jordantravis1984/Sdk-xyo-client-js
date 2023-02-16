import { assertEx } from '@xylabs/assert'
import { Module, ModuleFilter, ModuleRepository } from '@xyo-network/module-model'
import { Promisable } from '@xyo-network/promise'
import compact from 'lodash/compact'
import flatten from 'lodash/flatten'

//This class is now package private (not exported from index.ts)
export class SimpleModuleResolver<TModule extends Module = Module> implements ModuleRepository<TModule> {
  private addressToName: Record<string, string> = {}
  private modules: Record<string, TModule> = {}
  private nameToAddress: Record<string, string> = {}

  public get isModuleResolver() {
    return true
  }

  add(module: TModule, name?: string): this
  add(module: TModule[], name?: string[]): this
  add(module: TModule | TModule[], name?: string | string[]): this {
    if (Array.isArray(module)) {
      const nameArray = name ? assertEx(Array.isArray(name) ? name : undefined, 'name must be array or undefined') : undefined
      assertEx((nameArray?.length ?? module.length) === module.length, 'names/modules array mismatch')
      module.forEach((module, index) => this.addSingleModule(module, nameArray?.[index]))
    } else {
      this.addSingleModule(module, typeof name === 'string' ? name : undefined)
    }
    return this
  }

  remove(name: string | string[]): this
  remove(address: string | string[]): this {
    if (Array.isArray(address)) {
      address.forEach((address) => this.removeSingleModule(address))
    } else {
      this.removeSingleModule(address)
    }
    return this
  }

  resolve(filter?: ModuleFilter): Promisable<TModule[]> {
    const filteredByName: TModule[] = this.resolveByName(Object.values(this.modules), filter?.name)

    const filteredByAddress: TModule[] = filter?.address ? this.resolveByAddress(filteredByName, filter?.address) : filteredByName

    const filteredByConfigSchema: TModule[] = filter?.config ? this.resolveByConfigSchema(filteredByAddress, filter?.config) : filteredByAddress

    const filteredByQuery: TModule[] = filter?.query ? this.resolveByQuery(filteredByConfigSchema, filter?.query) : filteredByConfigSchema

    return filteredByQuery
  }

  private addSingleModule(module?: TModule, name?: string) {
    if (module) {
      this.modules[module.address] = module
      if (name) {
        this.nameToAddress[name] = module.address
        this.addressToName[module.address] = name
      }
    }
  }

  private removeSingleModule(addressOrName: string) {
    const resolvedAddress = this.modules[addressOrName] ? addressOrName : this.nameToAddress[addressOrName]
    if (resolvedAddress) {
      if (this.modules[resolvedAddress]) {
        delete this.modules[resolvedAddress]
        const name = this.addressToName[resolvedAddress]
        if (name) {
          delete this.nameToAddress[name]
          delete this.addressToName[resolvedAddress]
        }
      }
    }
  }

  private resolveByAddress(modules: TModule[], address?: string[]): TModule[] {
    return address
      ? compact(
          flatten(
            address?.map((address) => {
              return modules.filter((module) => module.address === address)
            }),
          ),
        )
      : modules
  }

  private resolveByConfigSchema(modules: TModule[], schema?: string[]): TModule[] {
    return schema
      ? compact(
          flatten(
            schema?.map((schema) => {
              return modules.filter((module) => module.config.schema === schema)
            }),
          ),
        )
      : modules
  }

  private resolveByName(modules: TModule[], name?: string[]): TModule[] {
    if (name) {
      const address = compact(name.map((name) => this.nameToAddress[name]))
      return this.resolveByAddress(modules, address)
    }
    return modules
  }

  private resolveByQuery(modules: TModule[], query?: string[][]): TModule[] {
    return query
      ? compact(
          modules.filter((module) =>
            query?.reduce((supported, queryList) => {
              return (
                queryList.reduce((supported, query) => {
                  const queryable = module.queries().includes(query)
                  return supported && queryable
                }, true) || supported
              )
            }, false),
          ),
        )
      : modules
  }
}
