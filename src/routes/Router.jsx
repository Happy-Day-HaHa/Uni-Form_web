import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import VerifyEmail from '../pages/VerifyEmail'
import ResetPassword from '../pages/ResetPassword'
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
import MyResponses from '../pages/MyResponses'
import SurveyManage from '../pages/SurveyManage'
import Settings from '../pages/Settings'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'
import AdminLayout from '../components/admin/AdminLayout'
import AdminForbidden from '../pages/AdminForbidden'
import Restricted from '../pages/Restricted'
import { AdminHome, AdminLeaderboard, AdminLogs, AdminMemberDetail, AdminMemberResponses, AdminMembers, AdminRewardDetail, AdminRewardNotice, AdminRewards, AdminSurveyDetail, AdminSurveys, AdminTeamDetail, AdminTeams } from '../pages/admin/AdminPagesV2'

export default function AppRouter() {
  return <Routes>
    <Route path="/" element={<Landing />} /><Route path="/versions" element={<Versions />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/verify-email" element={<VerifyEmail />} /><Route path="/reset-password" element={<ResetPassword />} /><Route path="/support" element={<Support />} /><Route path="/admin/forbidden" element={<AdminForbidden />} />
    <Route element={<PrivateRoute />}><Route path="/restricted" element={<Restricted />} /><Route path="/surveys" element={<SurveyList />} /><Route path="/settings" element={<Settings />} /><Route path="/activity" element={<Navigate to="/dashboard" replace />} /><Route path="/reports" element={<Navigate to="/my-surveys" replace />} /><Route path="/my-surveys" element={<MySurveys />} /><Route path="/my-responses" element={<MyResponses />} /><Route path="/my-surveys/:surveyId/manage" element={<SurveyManage />} /><Route path="/formmate" element={<SurveyCreate />} /><Route path="/surveys/create" element={<Navigate to="/formmate" replace />} /><Route path="/surveys/:surveyId/results" element={<SurveyResults />} /><Route path="/surveys/:surveyId" element={<SurveyResponse />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/leaderboard" element={<Leaderboard />} /><Route path="/team" element={<Team />} /><Route path="/team/join/:token" element={<TeamJoin />} /></Route>
    <Route element={<AdminRoute />}><Route element={<AdminLayout />}><Route path="/admin" element={<AdminHome />} /><Route path="/admin/surveys" element={<AdminSurveys />} /><Route path="/admin/surveys/:id" element={<AdminSurveyDetail />} /><Route path="/admin/members" element={<AdminMembers />} /><Route path="/admin/members/:id" element={<AdminMemberDetail />} /><Route path="/admin/teams" element={<AdminTeams />} /><Route path="/admin/teams/:id" element={<AdminTeamDetail />} /><Route path="/admin/leaderboard" element={<AdminLeaderboard />} /><Route path="/admin/leaderboard/:week/:memberId" element={<AdminMemberResponses />} /><Route path="/admin/rewards" element={<AdminRewards />} /><Route path="/admin/rewards/:week" element={<AdminRewardDetail />} /><Route path="/admin/leaderboard/notice" element={<AdminRewardNotice />} /><Route path="/admin/logs" element={<AdminLogs />} /></Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
