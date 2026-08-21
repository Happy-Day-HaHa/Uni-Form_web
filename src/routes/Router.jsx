import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Profile from '../pages/Profile'
import SurveyList from '../pages/SurveyList'
import SurveyResponse from '../pages/SurveyResponse'
import SurveyCreate from '../pages/SurveyCreate'
import Dashboard from '../pages/Dashboard'
import PrivateRoute from './PrivateRoute'

export default function AppRouter() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route element={<PrivateRoute />}><Route path="/profile" element={<Profile />} /><Route path="/surveys" element={<SurveyList />} /><Route path="/surveys/:surveyId" element={<SurveyResponse />} /><Route path="/surveys/create" element={<SurveyCreate />} /><Route path="/dashboard" element={<Dashboard />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>
}
