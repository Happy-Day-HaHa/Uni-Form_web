import { useCallback, useEffect, useRef, useState } from 'react'
import { applyFormMateChanges, createDraft, draftToForm, getDraft, publishDraft, sendFormMateMessage, SurveyVersionConflictError, updateDraft } from '../services/surveyService'

const AUTOSAVE_DELAY = 800

// 저장 여부 판단용 서명. 서버에 저장되는 필드만 보고, 문항 id/serverId는 빼서
// 저장 후 serverId만 채워 넣는 변경으로는 다시 저장하지 않는다.
function signatureOf(form) {
  const { title, description, targetCount, deadline, category, estimatedMinutes, questions } = form
  return JSON.stringify({ title, description, targetCount: Number(targetCount), deadline, category: category ?? '', estimatedMinutes: estimatedMinutes ?? '', questions: questions.map(({ id: _id, serverId: _serverId, ...rest }) => rest) })
}

// 서버에 저장된 문항 상태(마지막 저장/불러오기 기준)에 맞춰 문항의 serverId를 바로잡는다.
// - 화면 id → serverId 맵에 있으면 그 값을 쓴다(직전 저장의 setForm이 아직 렌더되기 전이어도 안전).
// - 서버에 없는 serverId(되돌리기로 되살아난 삭제 문항 등)는 지워 새 문항으로 보낸다. 같은 serverId가 두 번 나오면 두 번째부터 지운다.
// 바뀐 문항이 없으면 같은 배열을 돌려준다.
function reconcileQuestions(questions, serverIdByLocalId, serverKeys) {
  const used = new Set()
  let changed = false
  const next = questions.map((question) => {
    let serverId = serverIdByLocalId.get(question.id) ?? question.serverId ?? null
    if (serverId && (!serverKeys.has(serverId) || used.has(serverId))) serverId = null
    if (serverId) used.add(serverId)
    if ((question.serverId ?? null) === serverId) return question
    changed = true
    return { ...question, serverId }
  })
  return changed ? next : questions
}

function hasContent(form) {
  return Boolean(form.title.trim() || form.description.trim() || form.questions.some((question) => question.title.trim()))
}

// SurveyCreate(API 모드)의 초안 수명주기: 생성 → 자동 저장(PATCH, 낙관적 락) → FormMate → 게시.
// form/setForm은 화면이 소유하고, 이 훅은 서버와의 동기화만 맡는다.
export function useSurveyDraft({ enabled, form, setForm, initialDraftId = '', onDraftCreated, onConflict }) {
  const [draftId, setDraftId] = useState(initialDraftId)
  const [loading, setLoading] = useState(Boolean(enabled && initialDraftId))
  const [saveStatus, setSaveStatus] = useState('')
  const [error, setError] = useState('')
  const draftIdRef = useRef(initialDraftId)
  const versionRef = useRef(null)
  const formRef = useRef(form)
  const savedSignatureRef = useRef(signatureOf(form))
  const savingRef = useRef(null)
  // 마지막으로 저장/불러온 서버 문항 stableKey 집합과 화면 문항 id → serverId 맵. 저장 직전 보정에 쓴다.
  const serverKeysRef = useRef(new Set())
  const serverIdByLocalIdRef = useRef(new Map())
  const callbacksRef = useRef({ onDraftCreated, onConflict })
  // 화면이 사라진 뒤 끝난 저장이 화면 콜백(주소 변경 등)을 부르지 않게 한다 — 이미 다른 화면으로 이동했을 수 있다.
  const mountedRef = useRef(true)
  formRef.current = form
  callbacksRef.current = { onDraftCreated, onConflict }

  const rememberServerQuestions = useCallback((questions) => {
    serverKeysRef.current = new Set(questions.map((question) => question.serverId).filter(Boolean))
    serverIdByLocalIdRef.current = new Map(questions.filter((question) => question.serverId).map((question) => [question.id, question.serverId]))
  }, [])

  // 서버 상태를 화면에 반영할 때는 그 내용이 곧 "저장된 상태"다.
  const loadFromServer = useCallback((draft) => {
    const next = draftToForm(draft)
    versionRef.current = draft.version
    savedSignatureRef.current = signatureOf(next)
    // 이미 있던 문항은 화면 id를 그대로 둔다(선택 상태·React key 유지).
    const localIdByServerId = new Map()
    for (const question of formRef.current.questions) {
      const serverId = serverIdByLocalIdRef.current.get(question.id) ?? question.serverId
      if (serverId && !localIdByServerId.has(serverId)) localIdByServerId.set(serverId, question.id)
    }
    const questions = next.questions.map((question) => ({ ...question, id: localIdByServerId.get(question.serverId) ?? question.id }))
    rememberServerQuestions(questions)
    // formRef도 바로 바꿔 둔다. 렌더 전에 flush가 이어서 저장하면(버전 충돌 직후 등) 옛 편집을 다시 보내 방금 받은 최신 내용을 덮어쓰기 때문.
    formRef.current = { ...formRef.current, ...next, questions }
    // 예상 소요시간처럼 서버에 없는 화면 전용 필드는 유지한다.
    setForm((current) => ({ ...current, ...next, questions }))
    return next
  }, [rememberServerQuestions, setForm])

  useEffect(() => {
    if (!enabled || !initialDraftId) return undefined
    let active = true
    getDraft(initialDraftId)
      .then((draft) => {
        if (!active) return
        if (draft.status !== 'DRAFT') throw new Error('이미 게시된 설문은 수정할 수 없어요.')
        loadFromServer(draft)
        setSaveStatus('저장됨')
      })
      .catch((reason) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [enabled, initialDraftId, loadFromServer])

  // 전송할 form을 서버 문항 상태에 맞춘다(saveOnce와 keepalive 저장이 함께 쓴다).
  const reconcileForm = useCallback((current) => {
    const questions = reconcileQuestions(current.questions, serverIdByLocalIdRef.current, serverKeysRef.current)
    return questions === current.questions ? current : { ...current, questions }
  }, [])

  const saveOnce = useCallback(async () => {
    const snapshot = reconcileForm(formRef.current)
    const signature = signatureOf(snapshot)
    if (draftIdRef.current && signature === savedSignatureRef.current) return
    if (!draftIdRef.current && !hasContent(snapshot)) return

    setSaveStatus('저장 중…')
    if (!draftIdRef.current) {
      const created = await createDraft({ title: snapshot.title, description: snapshot.description })
      draftIdRef.current = created.id
      versionRef.current = created.version
      rememberServerQuestions([])
      setDraftId(created.id)
      if (mountedRef.current) callbacksRef.current.onDraftCreated?.(created.id)
    }
    try {
      const saved = await updateDraft(draftIdRef.current, snapshot, versionRef.current)
      versionRef.current = saved.version
      savedSignatureRef.current = signature
      // 서버는 보낸 순서대로 문항을 저장하고 id(stableKey)를 돌려준다. 이번 저장 결과를 기준으로 ref를 갱신하고,
      // 화면 문항의 serverId도 그 기준으로 맞춘다(이미 다른 serverId가 있어도 덮어쓰고, 서버에 없는 값은 지운다).
      rememberServerQuestions(snapshot.questions.map((question, index) => ({ id: question.id, serverId: saved.questions[index]?.id ?? null })))
      setForm((current) => {
        const questions = reconcileQuestions(current.questions, serverIdByLocalIdRef.current, serverKeysRef.current)
        return questions === current.questions ? current : { ...current, questions }
      })
      setSaveStatus('자동 저장됨')
    } catch (reason) {
      if (!(reason instanceof SurveyVersionConflictError) || !reason.latestSurvey) throw reason
      const mine = formRef.current
      loadFromServer(reason.latestSurvey)
      setSaveStatus('최신 내용으로 바뀜')
      if (mountedRef.current) callbacksRef.current.onConflict?.(mine, reason)
    }
  }, [loadFromServer, reconcileForm, rememberServerQuestions, setForm])

  // 저장은 한 번에 하나씩. 진행 중에 또 요청되면 끝난 뒤 최신 form으로 한 번 더 저장한다.
  const flush = useCallback(async () => {
    while (savingRef.current) await savingRef.current.catch(() => {})
    const run = saveOnce()
    savingRef.current = run
    try {
      await run
      setError('')
    } catch (reason) {
      setSaveStatus('저장 실패')
      setError(reason.message)
      throw reason
    } finally {
      if (savingRef.current === run) savingRef.current = null
    }
    if (signatureOf(formRef.current) !== savedSignatureRef.current && draftIdRef.current) await flush()
  }, [saveOnce])

  useEffect(() => {
    if (!enabled || loading) return undefined
    if (signatureOf(form) === savedSignatureRef.current) return undefined
    if (!draftIdRef.current && !hasContent(form)) return undefined
    setSaveStatus('저장 대기…')
    const timer = window.setTimeout(() => { flush().catch(() => {}) }, AUTOSAVE_DELAY)
    return () => window.clearTimeout(timer)
  }, [enabled, loading, form, flush])

  // ── 화면을 떠날 때 대기 중인 자동 저장을 버리지 않기 ─────────────────────
  const hasUnsaved = useCallback(() => {
    const snapshot = formRef.current
    if (signatureOf(snapshot) === savedSignatureRef.current) return false
    return Boolean(draftIdRef.current || hasContent(snapshot))
  }, [])

  // 앱 안에서 다른 화면으로 이동(링크·뒤로 가기)하면 이 화면이 사라진다. 그때 바로 저장을 보낸다 — 요청은 화면이 사라진 뒤에도 끝까지 진행된다.
  useEffect(() => {
    mountedRef.current = true
    if (!enabled) return undefined
    return () => {
      mountedRef.current = false
      if (hasUnsaved()) flush().catch(() => {})
    }
  }, [enabled, flush, hasUnsaved])

  useEffect(() => {
    if (!enabled) return undefined
    // 탭을 전환하거나 앱이 백그라운드로 가면 페이지가 살아 있으니 평소처럼 바로 저장한다.
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden' && hasUnsaved()) flush().catch(() => {})
    }
    // 새로고침·탭 닫기·외부 이동: keepalive로 마지막 저장을 보낸다.
    // 초안이 아직 없거나 다른 저장이 전송 중이면 순서를 보장할 수 없어, 대신 브라우저의 "나가시겠습니까?" 확인을 띄운다.
    function handleBeforeUnload(event) {
      if (!hasUnsaved()) return
      if (!draftIdRef.current || savingRef.current) {
        event.preventDefault()
        event.returnValue = ''
        return
      }
      const snapshot = reconcileForm(formRef.current)
      updateDraft(draftIdRef.current, snapshot, versionRef.current, { keepalive: true }).catch(() => {})
      savedSignatureRef.current = signatureOf(snapshot)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, flush, hasUnsaved, reconcileForm])

  // FormMate가 제목/설명을 바로 반영하면 서버 version이 1 오르지만 응답에 새 version은 없다.
  // 진행 중인 저장을 기다린 뒤 초안을 다시 받아 최신 version으로 맞춘다 — 이후 저장·제안 적용이 충돌하지 않게.
  // 화면에서는 제목/설명만 바꾸고, 기다리는 동안 입력한 다른 편집은 그대로 둔다(그 편집은 자동 저장된다).
  const syncAutoUpdated = useCallback(async ({ updatedTitle, updatedDescription }) => {
    const patch = {}
    if (updatedTitle !== undefined) patch.title = updatedTitle
    if (updatedDescription !== undefined) patch.description = updatedDescription ?? ''
    while (savingRef.current) await savingRef.current.catch(() => {})
    try {
      const latest = await getDraft(draftIdRef.current)
      versionRef.current = latest.version
      const latestForm = draftToForm(latest)
      savedSignatureRef.current = signatureOf(latestForm)
      // 제목/설명만 바뀌었지만 서버 문항 집합도 최신 값으로 맞춰 둔다(화면 id 맵은 그대로).
      serverKeysRef.current = new Set(latestForm.questions.map((question) => question.serverId).filter(Boolean))
    } catch {
      // 다시 받지 못하면 서버가 올린 만큼 직접 올린다. 어긋나면 다음 저장의 충돌 처리가 최신 내용으로 맞춘다.
      versionRef.current += 1
      savedSignatureRef.current = JSON.stringify({ ...JSON.parse(savedSignatureRef.current), ...patch })
    }
    setForm((current) => ({ ...current, ...patch }))
  }, [setForm])

  const sendMessage = useCallback(async (message) => {
    await flush()
    if (!draftIdRef.current) {
      // 아직 내용이 없어도 FormMate는 초안이 있어야 대화할 수 있다.
      const created = await createDraft({ title: formRef.current.title, description: formRef.current.description })
      draftIdRef.current = created.id
      versionRef.current = created.version
      rememberServerQuestions([])
      setDraftId(created.id)
      if (mountedRef.current) callbacksRef.current.onDraftCreated?.(created.id)
      await flush()
    }
    const reply = await sendFormMateMessage(draftIdRef.current, message)
    if (reply.updatedTitle !== undefined || reply.updatedDescription !== undefined) await syncAutoUpdated(reply)
    return reply
  }, [flush, rememberServerQuestions, syncAutoUpdated])

  const applyChanges = useCallback(async (changeIds, { revert = false } = {}) => {
    await flush()
    await applyFormMateChanges(draftIdRef.current, { changeIds, version: versionRef.current, revert })
      .catch((reason) => {
        if (reason instanceof SurveyVersionConflictError && reason.latestSurvey) loadFromServer(reason.latestSurvey)
        throw reason
      })
    // apply 응답에는 새 version만 오므로 적용된 문항 내용을 다시 불러온다.
    loadFromServer(await getDraft(draftIdRef.current))
    setSaveStatus('자동 저장됨')
  }, [flush, loadFromServer])

  const publish = useCallback(async () => {
    await flush()
    return publishDraft(draftIdRef.current)
  }, [flush])

  return { draftId, loading, saveStatus, error, flush, sendMessage, applyChanges, publish }
}
