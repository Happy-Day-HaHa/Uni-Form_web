import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { useAuth } from '../hooks/useAuth'
import { getProfile, saveProfile } from '../services/userService'

const interestOptions = ['교육', '라이프스타일', '소비', '테크', '문화']
export default function Profile() {
  const { user, demoMode } = useAuth()
  const [profile, setProfile] = useState({ name: '', age_group: '20대', region: '서울', interests: [] })
  const [message, setMessage] = useState('')
  useEffect(() => { if (user) getProfile(user.id).then(setProfile).catch((error) => setMessage(error.message)) }, [user])
  function toggleInterest(interest) { setProfile((current) => ({ ...current, interests: current.interests.includes(interest) ? current.interests.filter((item) => item !== interest) : [...current.interests, interest] })) }
  async function handleSubmit(event) {
    event.preventDefault()
    try { await saveProfile({ ...profile, id: user.id }); setMessage(demoMode ? '데모 프로필에 반영했습니다.' : '프로필을 저장했습니다.') } catch (error) { setMessage(error.message) }
  }
  return <><Header /><main className="app-main app-main--narrow"><div className="page-heading"><p className="eyebrow">MY PROFILE</p><h1>나에게 맞는 설문을 만나세요.</h1><p>설문 추천에 사용할 기본 정보입니다.</p></div><form className="panel form-stack" onSubmit={handleSubmit}><label>이름<input value={profile.name || ''} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label><div className="form-grid"><label>연령대<select value={profile.age_group || ''} onChange={(event) => setProfile({ ...profile, age_group: event.target.value })}>{['10대', '20대', '30대', '40대', '50대 이상'].map((item) => <option key={item}>{item}</option>)}</select></label><label>지역<select value={profile.region || ''} onChange={(event) => setProfile({ ...profile, region: event.target.value })}>{['서울', '경기', '인천', '충청', '전라', '경상', '강원', '제주'].map((item) => <option key={item}>{item}</option>)}</select></label></div><fieldset className="choice-field"><legend>관심 분야</legend><div className="chip-list">{interestOptions.map((interest) => <label className={profile.interests?.includes(interest) ? 'is-selected' : ''} key={interest}><input type="checkbox" checked={profile.interests?.includes(interest) || false} onChange={() => toggleInterest(interest)} />{interest}</label>)}</div></fieldset>{message && <p className="form-message">{message}</p>}<button className="button" type="submit">프로필 저장</button></form></main></>
}
