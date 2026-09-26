import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import VerifyEmail from '../pages/VerifyEmail'
import SurveyList from '../pages/SurveyList'
import SurveyResponse from '../pages/SurveyResponse'
import SurveyCreate from '../pages/SurveyCreate'
import SurveyResults from '../pages/SurveyResults'
import Dashboard from '../pages/Dashboard'
import Leaderboard from '../pages/Leaderboard'
import Team from '../pages/Team'
import TeamJoin from '../pages/TeamJoin'
import Support from '../pages/Support'
import Versions from '../pages/Versions'
import MySurveys from '../pages/MySurveys'
import SurveyManage from '../pages/SurveyManage'
import Settings from '../pages/Settings'
import PrivateRoute from './PrivateRoute'

export default function AppRouter() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/versions" element={<Versions />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/verify-email" element={<VerifyEmail />} /><Route path="/surveys" element={<SurveyList />} /><Route path="/support" element={<Support />} /><Route element={<PrivateRoute />}><Route path="/settings" element={<Settings />} /><Route path="/activity" element={<Navigate to="/dashboard" replace />} /><Route path="/reports" element={<Navigate to="/my-surveys" replace />} /><Route path="/my-surveys" element={<MySurveys />} /><Route path="/my-surveys/:surveyId/manage" element={<SurveyManage />} /><Route path="/formmate" element={<SurveyCreate />} /><Route path="/surveys/create" element={<Navigate to="/formmate" replace />} /><Route path="/surveys/:surveyId/results" element={<SurveyResults />} /><Route path="/surveys/:surveyId" element={<SurveyResponse />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/leaderboard" element={<Leaderboard />} /><Route path="/team" element={<Team />} /><Route path="/team/join/:token" element={<TeamJoin />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>
}
