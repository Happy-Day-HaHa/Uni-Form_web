import { supabase } from './supabase'

export async function submitSurveyResponse(surveyId, answers) {
  if (!supabase) return { response_id: crypto.randomUUID(), reward_points: 320 }
  const { data, error } = await supabase.rpc('submit_survey_response', { target_survey_id: surveyId, submitted_answers: answers })
  if (error) throw error
  return data
}
export async function getSurveyResponses(surveyId) {
  if (!supabase) return []
  const { data, error } = await supabase.from('responses').select('*').eq('survey_id', surveyId)
  if (error) throw error
  return data
}
