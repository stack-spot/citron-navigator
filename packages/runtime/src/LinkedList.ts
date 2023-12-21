type Comparator<T> = (a: T, b: T) => number

interface Item<T> {
  value: T,
  next?: Item<T>,
}

interface RootItem<T> {
  value: typeof empty,
  next?: Item<T>,
}

const empty = Symbol('empty')

export class LinkedList<T = any> {
  private root: RootItem<T> = { value: empty }
  private compare: Comparator<T>

  constructor(compare: Comparator<T>) {
    this.compare = compare
  }

  push(element: T) {
    let prev: Item<T> | undefined = this.root as Item<T>

    while (prev) {
      if (!prev.next) {
        return prev.next = { value: element }
      }
      const comparison = this.compare(element, prev.next.value)
      if (comparison <= 0) {
        const newItem = { value: element, next: prev.next }
        return prev.next = newItem
      }
      prev = prev.next
    }
  }

  find(predicate: (element: T) => boolean): T | undefined {
    let current = this.root.next
    while (current && !predicate(current.value)) current = current.next
    return current?.value
  }
}
