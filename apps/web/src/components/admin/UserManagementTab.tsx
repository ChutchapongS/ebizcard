'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Shield, Users, UserCheck, UserX, AlertCircle, Clock, Ban, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUserType, getUsers } from '@/lib/api-client';

interface UserManagementTabProps {
  userRole: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: 'owner' | 'admin' | 'user';
  user_plan?: 'Free' | 'Standard' | 'Pro';
  is_active: boolean;
  role_updated_at: string;
  created_at: string;
  assigned_by?: {
    id: string;
    full_name: string;
  };
}

interface RoleChange {
  id: string;
  old_role: string;
  new_role: string;
  reason?: string;
  created_at: string;
  changed_by: {
    id: string;
    full_name: string;
  };
}

export default function UserManagementTab({ userRole }: UserManagementTabProps) {
  const { user, session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<'owner' | 'admin' | 'user'>('user');
  const [newPlan, setNewPlan] = useState<'Free' | 'Standard' | 'Pro'>('Free');
  const [reason, setReason] = useState('');

  // Check if current user is admin or owner
  const currentUserRole = users.find(u => u.id === user?.id)?.user_type;
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';
  const isOwner = currentUserRole === 'owner';

  useEffect(() => {
    if (user && session) {
      fetchUsers();
    }
  }, [user, session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getUsers();
      
      setUsers(data.users);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string, plan: string | null, reason: string) => {
    try {
      const requestBody: any = {
        targetUserId: userId,
        newRole: role,
        reason: reason
      };

      // Add plan only if it's a regular user
      if (plan && role === 'user') {
        requestBody.newPlan = plan;
      }

      const data = await updateUserType(
        requestBody.targetUserId,
        requestBody.newRole,
        requestBody.newPlan,
        requestBody.reason
      );
      
      toast.success(data.message || 'อัปเดตสิทธิ์ผู้ใช้สำเร็จ');
      
      // Refresh users list
      await fetchUsers();
      setShowRoleModal(false);
      setSelectedUser(null);
      setReason('');
      setNewPlan('Free');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสิทธิ์ได้');
    }
  };

  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.user_type);
    setNewPlan(user.user_plan || 'Free');
    setShowRoleModal(true);
  };


  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="w-4 h-4" />;
      case 'admin': return <UserCheck className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getPlanBadgeColor = (plan: string, userType: string) => {
    // Admin and Owner always have Pro access
    if (userType === 'admin' || userType === 'owner') {
      return 'bg-purple-100 text-purple-800';
    }
    
    switch (plan) {
      case 'Pro': return 'bg-purple-100 text-purple-800';
      case 'Standard': return 'bg-blue-100 text-blue-800';
      case 'Free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffectivePlan = (userType: string, userPlan?: string) => {
    if (userType === 'admin' || userType === 'owner') {
      return 'Pro';
    }
    return userPlan || 'Free';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">จัดการผู้ใช้</h2>
          <p className="mt-1 text-sm text-gray-600">
            จัดการสิทธิ์และการเข้าถึงของผู้ใช้ในระบบ
          </p>
          <div className="mt-2 md:hidden text-sm text-gray-500">
            ผู้ใช้ทั้งหมด: <span className="font-semibold text-gray-900">{users.length}</span> คน
          </div>
        </div>
        <div className="hidden md:block text-sm text-gray-500">
          ผู้ใช้ทั้งหมด: <span className="font-semibold text-gray-900">{users.length}</span> คน
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table - Desktop */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้ใช้
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สิทธิ์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    แผน
                  </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สมัคร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  อัปเดตล่าสุด
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userData) => (
                <tr key={userData.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {userData.full_name || 'ไม่มีชื่อ'}
                      </div>
                      <div className="text-sm text-gray-500">{userData.email}</div>
                    </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userData.user_type)}`}>
                        {getRoleIcon(userData.user_type)}
                        <span className="ml-1 capitalize">
                          {userData.user_type === 'owner' ? 'เจ้าของ' : 
                           userData.user_type === 'admin' ? 'ผู้ดูแลระบบ' : 
                           'ผู้ใช้'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(getEffectivePlan(userData.user_type, userData.user_plan), userData.user_type)}`}>
                        {getEffectivePlan(userData.user_type, userData.user_plan)}
                        {userData.user_type === 'admin' || userData.user_type === 'owner' ? (
                          <span className="ml-1 text-xs">(Admin)</span>
                        ) : null}
                      </span>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {userData.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                      {userData.is_active ? 'ใช้งาน' : 'ปิดการใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(userData.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userData.role_updated_at ? new Date(userData.role_updated_at).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleRoleChange(userData)}
                      disabled={userData.id === user?.id} // Can't change own role
                      className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      เปลี่ยนสิทธิ์
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {users.map((userData) => (
          <div key={userData.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {/* Header: Name and Email */}
            <div className="mb-3">
              <div className="text-base font-semibold text-gray-900 mb-1">
                {userData.full_name || 'ไม่มีชื่อ'}
              </div>
              <div className="text-sm text-gray-500">{userData.email}</div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userData.user_type)}`}>
                {getRoleIcon(userData.user_type)}
                <span className="ml-1 capitalize">
                  {userData.user_type === 'owner' ? 'เจ้าของ' : 
                   userData.user_type === 'admin' ? 'ผู้ดูแลระบบ' : 
                   'ผู้ใช้'}
                </span>
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(getEffectivePlan(userData.user_type, userData.user_plan), userData.user_type)}`}>
                {getEffectivePlan(userData.user_type, userData.user_plan)}
                {userData.user_type === 'admin' || userData.user_type === 'owner' ? (
                  <span className="ml-1 text-xs">(Admin)</span>
                ) : null}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userData.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                {userData.is_active ? 'ใช้งาน' : 'ปิดการใช้งาน'}
              </span>
            </div>

            {/* Dates */}
            <div className="space-y-1 mb-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500">วันที่สมัคร:</span>
                <span>{new Date(userData.created_at).toLocaleDateString('th-TH')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">อัปเดตล่าสุด:</span>
                <span>{userData.role_updated_at ? new Date(userData.role_updated_at).toLocaleDateString('th-TH') : '-'}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleRoleChange(userData)}
              disabled={userData.id === user?.id}
              className="w-full mt-3 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors"
            >
              เปลี่ยนสิทธิ์
            </button>
          </div>
        ))}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">เปลี่ยนสิทธิ์ผู้ใช้</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  กำลังเปลี่ยนสิทธิ์สำหรับ: <strong>{selectedUser.full_name}</strong>
                </p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สิทธิ์ใหม่
                </label>
                <select
                  value={newRole}
                  onChange={(e) => {
                    const role = e.target.value as 'owner' | 'admin' | 'user';
                    setNewRole(role);
                    // Reset plan when role changes to admin/owner
                    if (role === 'admin' || role === 'owner') {
                      setNewPlan('Pro');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isOwner && newRole === 'owner'} // Only owners can assign owner role
                >
                  <option value="user">ผู้ใช้ (User)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  {isOwner && <option value="owner">เจ้าของ (Owner)</option>}
                </select>
              </div>

              {/* Plan selection - only show for regular users */}
              {newRole === 'user' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    แผนการใช้งาน
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as 'Free' | 'Standard' | 'Pro')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Free">Free - พื้นฐาน</option>
                    <option value="Standard">Standard - มาตรฐาน</option>
                    <option value="Pro">Pro - มืออาชีพ</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Free: ฟรี, Standard: ฟีเจอร์เพิ่มเติม, Pro: ครบทุกฟีเจอร์
                  </p>
                </div>
              )}

              {/* Show info for admin/owner */}
              {(newRole === 'admin' || newRole === 'owner') && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="text-sm text-purple-800 font-medium">
                      {newRole === 'owner' ? 'เจ้าของ' : 'ผู้ดูแลระบบ'} จะมีสิทธิ์ Pro อัตโนมัติ
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผล (ไม่บังคับ)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="ระบุเหตุผลในการเปลี่ยนสิทธิ์..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => updateUserRole(selectedUser.id, newRole, newPlan, reason)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                อัปเดตสิทธิ์
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

