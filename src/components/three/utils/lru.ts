export class LRUCache<K, V> {
  private maxSize: number
  private map: Map<K, V>

  constructor(maxSize: number) {
    this.maxSize = Math.max(1, maxSize)
    this.map = new Map()
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined
    const value = this.map.get(key)!
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.maxSize) {
      const firstKey = this.map.keys().next().value
      if (firstKey !== undefined) this.map.delete(firstKey)
    }
  }

  delete(key: K): void {
    this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }

  size(): number {
    return this.map.size
  }
}
