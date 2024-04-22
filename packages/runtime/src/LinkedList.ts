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

/**
 * A Linked List ordered according to the comparator passed to the constructor.
 */
export class LinkedList<T = any> {
  private root: RootItem<T> = { value: empty }
  private compare: Comparator<T>

  constructor(compare: Comparator<T>) {
    this.compare = compare
  }

  /**
   * Adds a new element to the linked list.
   * 
   * This performs an ordered insertion, costing O(n) in the worst case.
   * @param element the element to add
   */
  push(element: T): void {
    let prev: Item<T> | undefined = this.root as Item<T>

    while (prev) {
      if (!prev.next) {
        prev.next = { value: element }
        return
      }
      const comparison = this.compare(element, prev.next.value)
      if (comparison <= 0) {
        const newItem = { value: element, next: prev.next }
        prev.next = newItem
        return
      }
      prev = prev.next
    }
  }

  /**
   * Finds the first element where the predicate returns true.
   * 
   * Remember that this data structure is ordered and the element returned will depend on the comparison function passed to the constructor.
   * @param predicate the function that looks for an element.
   * @returns the element found or undefined if no element meets the predicate.
   */
  find(predicate: (element: T) => boolean): T | undefined {
    let current = this.root.next
    while (current && !predicate(current.value)) current = current.next
    return current?.value
  }
}
