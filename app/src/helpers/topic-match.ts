export function topicMatchesFilter(filter: string, topic: string): boolean {
  const filterParts = filter.split('/')
  const topicParts = topic.split('/')

  let fi = 0
  let ti = 0

  while (fi < filterParts.length) {
    const segment = filterParts[fi]

    if (segment === '#') {
      return fi === filterParts.length - 1
    }

    if (ti >= topicParts.length) {
      return false
    }

    if (segment === '+') {
      fi++
      ti++
      continue
    }

    if (segment !== topicParts[ti]) {
      return false
    }

    fi++
    ti++
  }

  return ti === topicParts.length
}

export function lastTopicSegment(topic: string): string {
  return topic.split('/').at(-1) ?? ''
}
