export function matchesProfile(survey, profile) {
  const audience = survey.audience || {}
  if (audience.age_groups?.length && !audience.age_groups.includes(profile.age_group)) return false
  if (audience.regions?.length && !audience.regions.includes(profile.region)) return false
  return true
}
