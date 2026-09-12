import { useEffect, useRef } from 'react'

export function useReveal(dependencies = []) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canObserve = 'IntersectionObserver' in window && !reducedMotion
    const observer = canObserve ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }) : null

    const register = (node) => {
      if (!(node instanceof Element)) return
      const items = [
        ...(node.matches('[data-motion-reveal]') ? [node] : []),
        ...node.querySelectorAll('[data-motion-reveal]'),
      ]
      items.forEach((item) => {
        if (item.classList.contains('is-visible')) return
        if (observer) observer.observe(item)
        else item.classList.add('is-visible')
      })
    }

    register(root)
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(register))
    })
    mutations.observe(root, { childList: true, subtree: true })

    return () => {
      mutations.disconnect()
      observer?.disconnect()
    }
  }, dependencies)

  return rootRef
}
