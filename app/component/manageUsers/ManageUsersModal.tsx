"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateRole } from "@/app/lib/actions"; 

export default function ManageUsersModal({
  users,
  isOpen,
  onClose,
}: {
  users: Array<{ clerk_user_id: string; email: string; role: string }>;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localUsers, setLocalUsers] = useState(users); // Manage users locally for optimistic updates

  // Handle role change for a user
  const handleRoleChange = async (userId: string, currentRole: string) => {
    setIsUpdating(true);
    const newRole = currentRole === "admin" ? "public" : "admin";

    try {
      // Optimistic update: Update the UI immediately
      setLocalUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.clerk_user_id === userId ? { ...user, role: newRole } : user
        )
      );

      const result = await updateRole(userId, newRole);

      if (!result.success) {
        console.error("Failed to update role:", result.error);
        // Revert optimistic update if API call fails
        setLocalUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.clerk_user_id === userId ? { ...user, role: currentRole } : user
          )
        );
        // Potentially show a user-facing error message here
      }
    } catch (error) {
      console.error("Error calling updateRole:", error);
      // Revert optimistic update on unexpected errors
      setLocalUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.clerk_user_id === userId ? { ...user, role: currentRole } : user
        )
      );
      // Potentially show a user-facing error message here
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center backdrop-blur-sm justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Manage Users</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - User Table */}
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localUsers.length > 0 ? (
                localUsers.map((user) => (
                  <tr key={user.clerk_user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          handleRoleChange(user.clerk_user_id, user.role)
                        }
                        disabled={isUpdating} // Disable all buttons during an update
                        className={`px-3 py-1 rounded-md text-white transition ${
                          user.role === "admin"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {user.role === "admin"
                          ? "Demote to Public"
                          : "Promote to Admin"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
