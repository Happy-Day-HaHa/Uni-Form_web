import { useCallback, useEffect, useRef, useState } from 'react'
import { applyFormMateChanges, createDraft, draftToForm, getDraft, publishDraft, sendFormMateMessage, SurveyVersionConflictError, updateDraft } from '../services/surveyService'

const AUTOSAVE_DELAY = 800

// 저장 여부 판단용 서명. 서버에 저장되는 필드만 보고, 문항 id/serverId는 빼서
// 저장 후 serverId만 채워 넣는 변경으로는 다시 저장하지 않는다.
function signatureOf(form) {
  const { title, description, targetCount, deadline, questions } = form
  return JSON.stringify({ title, description, targetCount: Number(targetCount), deadline, questions: questions.map(({ id: _id, serverId: _serverId, ...rest }) => rest) })
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
  const callbacksRef = useRef({ onDraftCreated, onConflict })
  // 화면이 사라진 뒤 끝난 저장이 화면 콜백(주소 변경 등)을 부르지 않게 한다 — 이미 다른 화면으로 이동했을 수 있다.
  const mountedRef = useRef(true)
  formRef.current = form
  callbacksRef.current = { onDraftCreated, onConflict }

  // 서버 상태를 화면에 반영할 때는 그 내용이 곧 "저장된 상태"다.
  const loadFromServer = useCallback((draft) => {
    const next = draftToForm(draft)
    versionRef.current = draft.version
    savedSignatureRef.current = signatureOf(next)
    // 예상 소요시간처럼 서버에 없는 화면 전용 필드는 유지하고, 이미 있던 문항은 화면 id를 그대로 둔다(선택 상태·React key 유지).
    setForm((current) => {
      const localIdByServerId = new Map(current.questions.filter((question) => question.serverId).map((question) => [question.serverId, question.id]))
      return { ...current, ...next, questions: next.questions.map((question) => ({ ...question, id: localIdByServerId.get(question.serverId) ?? question.id })) }
    })
    return next
  }, [setForm])

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

  const saveOnce = useCallback(async () => {
    const snapshot = formRef.current
    const signature = signatureOf(snapshot)
    if (draftIdRef.current && signature === savedSignatureRef.current) return
    if (!draftIdRef.current && !hasContent(snapshot)) return

    setSaveStatus('저장 중…')
    if (!draftIdRef.current) {
      const created = await createDraft({ title: snapshot.title, description: snapshot.description })
      draftIdRef.current = created.id
      versionRef.current = created.version
      setDraftId(created.id)
      if (mountedRef.current) callbacksRef.current.onDraftCreated?.(created.id)
    }
    try {
      const saved = await updateDraft(draftIdRef.current, snapshot, versionRef.current)
      versionRef.current = saved.version
      savedSignatureRef.current = signature
      // 새로 만든 문항에 서버가 붙인 id(stableKey)를 연결한다. 서버는 보낸 순서대로 문항을 저장한다.
      const serverIds = new Map(snapshot.questions.map((question, index) => [question.id, saved.questions[index]?.id]))
      if (snapshot.questions.some((question) => !question.serverId)) {
        setForm((current) => ({ ...current, questions: current.questions.map((question) => question.serverId || !serverIds.get(question.id) ? question : { ...question, serverId: serverIds.get(question.id) }) }))
      }
      setSaveStatus('자동 저장됨')
    } catch (reason) {
      if (!(reason instanceof SurveyVersionConflictError) || !reason.latestSurvey) throw reason
      const mine = formRef.current
      loadFromServer(reason.latestSurvey)
      setSaveStatus('최신 내용으로 바뀜')
      if (mountedRef.current) callbacksRef.current.onConflict?.(mine, reason)
    }
  }, [loadFromServer, setForm])

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
      const snapshot = formRef.current
      updateDraft(draftIdRef.current, snapshot, versionRef.current, { keepalive: true }).catch(() => {})
      savedSignatureRef.current = signatureOf(snapshot)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, flush, hasUnsaved])

  const sendMessage = useCallback(async (message) => {
    await flush()
    if (!draftIdRef.current) {
      // 아직 내용이 없어도 FormMate는 초안이 있어야 대화할 수 있다.
      const created = await createDraft({ title: formRef.current.title, description: formRef.current.description })
      draftIdRef.current = created.id
      versionRef.current = created.version
      setDraftId(created.id)
      if (mountedRef.current) callbacksRef.current.onDraftCreated?.(created.id)
      await flush()
    }
    return sendFormMateMessage(draftIdRef.current, message)
  }, [flush])

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
