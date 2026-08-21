export const calculateSurveyBudget = (targetCount, rewardPoints) => Math.max(0, Number(targetCount) * Number(rewardPoints))
export const formatPoints = (points) => `${Number(points || 0).toLocaleString('ko-KR')} P`
