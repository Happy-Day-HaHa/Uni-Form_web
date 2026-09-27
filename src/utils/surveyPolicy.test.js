import test from 'node:test'
import assert from 'node:assert/strict'
import { getKstDateString, getKstEndOfDay, isDeadlineExpired, isValidDeadline } from './surveyPolicy.js'
import { validateResponseAnswers, validateSurvey } from './validation.js'

const deadline = '2026-09-22'
const questions = [
  { id: 'one', type: 'single', title: '가장 가까운 경험은 무엇인가요?', options: ['a', 'b'] },
  { id: 'two', type: 'text', title: '어떤 점이 가장 도움이 되었나요?' },
  { id: 'three', type: 'long', title: '자세한 의견을 자유롭게 적어주세요.' },
]
const survey = { title: '설문 제목', questions, targetCount: 50, deadline }

test('KST deadline accepts today and remains open through 23:59:59.999', () => {
  const afternoon = new Date('2026-09-22T07:00:00.000Z')
  const lastMoment = new Date('2026-09-22T14:59:59.999Z')
  const nextDay = new Date('2026-09-22T15:00:00.000Z')
  assert.equal(getKstDateString(afternoon), deadline)
  assert.equal(isValidDeadline(deadline, afternoon), true)
  assert.equal(getKstEndOfDay(deadline)?.toISOString(), lastMoment.toISOString())
  assert.equal(isDeadlineExpired(deadline, lastMoment), false)
  assert.equal(isDeadlineExpired(deadline, nextDay), true)
  assert.equal(isValidDeadline(deadline, nextDay), false)
  assert.equal(isValidDeadline('2026-09-21', afternoon), false)
  assert.equal(isValidDeadline('2026-09-31', afternoon), false)
})

test('survey validation accepts today and preserves the 50 character option limit', () => {
  const now = new Date('2026-09-22T07:00:00.000Z')
  assert.equal(validateSurvey(survey, now), '')
  assert.match(validateSurvey({ ...survey, deadline: '2026-09-21' }, now), /오늘 또는 이후/)
  assert.match(validateSurvey({ ...survey, questions: [{ ...questions[0], options: ['a'.repeat(51), 'b'] }, ...questions.slice(1)] }, now), /보기는 최대 50자/)
})

test('short answers allow 100 characters and reject 101; long answers keep their policy', () => {
  assert.equal(validateResponseAnswers(questions, { two: '가'.repeat(100), three: '가'.repeat(501) }), '')
  assert.match(validateResponseAnswers(questions, { two: '가'.repeat(101) }), /최대 100자/)
})
