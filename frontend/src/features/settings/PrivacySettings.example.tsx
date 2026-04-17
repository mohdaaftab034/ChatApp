/**
 * Privacy Settings - Frontend Components Example
 * These are example React/TypeScript components showing how to use the privacy API
 * Adapt these to your frontend structure
 */

// ============================================================================
// 1. Privacy Settings Hook - Use this to manage privacy settings
// ============================================================================

import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'

export interface PrivacySettings {
  lastSeen: 'nobody' | 'contacts' | 'everyone'
  profilePhoto: 'nobody' | 'contacts' | 'everyone'
  onlineStatus: 'nobody' | 'contacts' | 'everyone'
  typingStatus: 'nobody' | 'contacts' | 'everyone'
  aboutInfo: 'nobody' | 'contacts' | 'everyone'
  readReceipts: boolean
}

export function usePrivacySettings() {
  // Get all privacy settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: async () => {
      const response = await axios.get('/api/privacy/me')
      return response.data.data as PrivacySettings
    },
  })

  // Update all privacy settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<PrivacySettings>) => {
      const response = await axios.patch('/api/privacy/me', updates)
      return response.data.data
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] })
    },
  })

  // Update a single setting
  const updateSingleMutation = useMutation({
    mutationFn: async ({ setting, value }: { setting: string; value: any }) => {
      const response = await axios.patch(`/api/privacy/me/${setting}`, { value })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] })
    },
  })

  // Reset to defaults
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/privacy/me/reset')
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] })
    },
  })

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    updateSingle: updateSingleMutation.mutate,
    reset: resetMutation.mutate,
    isUpdating: updateSettingsMutation.isPending || updateSingleMutation.isPending,
  }
}

// ============================================================================
// 2. Privacy Settings Panel Component
// ============================================================================

import React from 'react'

interface PrivacyPanelProps {
  settings?: PrivacySettings
  onUpdate: (setting: keyof PrivacySettings, value: any) => void
  isLoading?: boolean
}

const VISIBILITY_OPTIONS = ['nobody', 'contacts', 'everyone'] as const
const VISIBILITY_LABELS = {
  nobody: 'Nobody (Private)',
  contacts: 'Contacts Only',
  everyone: 'Everyone (Public)',
}

export const PrivacyPanel: React.FC<PrivacyPanelProps> = ({
  settings,
  onUpdate,
  isLoading,
}) => {
  if (isLoading) {
    return <div>Loading privacy settings...</div>
  }

  if (!settings) {
    return <div>No privacy settings available</div>
  }

  return (
    <div className="privacy-panel">
      <h2>Privacy Settings</h2>

      {/* Last Seen */}
      <div className="privacy-setting">
        <label>Last Seen</label>
        <p className="description">Who can see when you were last active</p>
        <select
          value={settings.lastSeen}
          onChange={(e) => onUpdate('lastSeen', e.target.value)}
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VISIBILITY_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {/* Profile Photo */}
      <div className="privacy-setting">
        <label>Profile Photo</label>
        <p className="description">Who can see your profile picture</p>
        <select
          value={settings.profilePhoto}
          onChange={(e) => onUpdate('profilePhoto', e.target.value)}
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VISIBILITY_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {/* Online Status */}
      <div className="privacy-setting">
        <label>Online Status</label>
        <p className="description">Who can see if you're online, away, or busy</p>
        <select
          value={settings.onlineStatus}
          onChange={(e) => onUpdate('onlineStatus', e.target.value)}
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VISIBILITY_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {/* Typing Status */}
      <div className="privacy-setting">
        <label>Typing Status</label>
        <p className="description">Who can see when you're typing a message</p>
        <select
          value={settings.typingStatus}
          onChange={(e) => onUpdate('typingStatus', e.target.value)}
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VISIBILITY_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {/* About Info */}
      <div className="privacy-setting">
        <label>About Information</label>
        <p className="description">Who can see your bio, location, and social links</p>
        <select
          value={settings.aboutInfo}
          onChange={(e) => onUpdate('aboutInfo', e.target.value)}
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VISIBILITY_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {/* Read Receipts */}
      <div className="privacy-setting">
        <label>Read Receipts</label>
        <p className="description">Show when you've read messages</p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.readReceipts}
            onChange={(e) => onUpdate('readReceipts', e.target.checked)}
          />
          <span>Show read receipts</span>
        </label>
      </div>

      <style>{`
        .privacy-panel {
          max-width: 500px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .privacy-panel h2 {
          margin-top: 0;
          margin-bottom: 24px;
          font-size: 20px;
          font-weight: 600;
        }

        .privacy-setting {
          margin-bottom: 20px;
          padding: 16px;
          background: white;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .privacy-setting label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
          color: #333;
        }

        .privacy-setting .description {
          font-size: 12px;
          color: #666;
          margin: 0 0 12px 0;
        }

        .privacy-setting select,
        .privacy-setting input[type='checkbox'] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .privacy-setting input[type='checkbox'] {
          width: auto;
          margin-right: 8px;
        }

        .checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .checkbox span {
          margin-left: 8px;
          color: #333;
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// 3. Privacy Settings Page Component
// ============================================================================

export const PrivacySettingsPage: React.FC = () => {
  const {
    settings,
    isLoading,
    updateSettings,
    updateSingle,
    reset,
    isUpdating,
  } = usePrivacySettings()

  const handleUpdate = (setting: keyof PrivacySettings, value: any) => {
    updateSingle({ setting, value })
  }

  const handleReset = () => {
    if (window.confirm('Reset privacy settings to defaults?')) {
      reset()
    }
  }

  return (
    <div className="privacy-page">
      <h1>Privacy Settings</h1>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <PrivacyPanel
            settings={settings}
            onUpdate={handleUpdate}
            isLoading={isUpdating}
          />

          <div className="privacy-actions">
            <button onClick={handleReset} disabled={isUpdating} className="reset-btn">
              Reset to Defaults
            </button>
          </div>

          <div className="privacy-info">
            <h3>About These Settings</h3>
            <ul>
              <li>
                <strong>Nobody:</strong> Only you can see this information
              </li>
              <li>
                <strong>Contacts Only:</strong> Only people in your contacts list can see this
              </li>
              <li>
                <strong>Everyone:</strong> All users in the app can see this information
              </li>
            </ul>
          </div>
        </>
      )}

      <style>{`
        .privacy-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .privacy-page h1 {
          margin-bottom: 30px;
          color: #333;
        }

        .privacy-actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }

        .reset-btn {
          padding: 10px 20px;
          background: #ff6b6b;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .reset-btn:hover:not(:disabled) {
          background: #ff5252;
        }

        .reset-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .privacy-info {
          margin-top: 30px;
          padding: 20px;
          background: #f0f4ff;
          border-left: 4px solid #4c6ef5;
          border-radius: 4px;
        }

        .privacy-info h3 {
          margin-top: 0;
          color: #2c3e50;
        }

        .privacy-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .privacy-info li {
          margin: 10px 0;
          color: #555;
          line-height: 1.6;
        }

        .privacy-info strong {
          color: #2c3e50;
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// 4. Quick Privacy Settings Modal
// ============================================================================

interface PrivacyModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  const { settings, isLoading, updateSingle } = usePrivacySettings()

  if (!isOpen || !settings) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Privacy Settings</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <div className="modal-body">
          <PrivacyPanel
            settings={settings}
            onUpdate={(setting, value) => updateSingle({ setting, value })}
            isLoading={isLoading}
          />
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="close-modal-btn">
            Done
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          padding: 15px 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
        }

        .close-modal-btn {
          padding: 10px 20px;
          background: #4c6ef5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .close-modal-btn:hover {
          background: #3b5bdb;
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// 5. Usage Example
// ============================================================================

/**
 * Example of how to use these components in your app:
 *
 * import { PrivacySettingsPage, PrivacyModal } from './privacy-components'
 *
 * function App() {
 *   const [showPrivacyModal, setShowPrivacyModal] = useState(false)
 *
 *   return (
 *     <>
 *       <button onClick={() => setShowPrivacyModal(true)}>
 *         Privacy Settings
 *       </button>
 *
 *       <PrivacyModal
 *         isOpen={showPrivacyModal}
 *         onClose={() => setShowPrivacyModal(false)}
 *       />
 *
 *       {/* Or use full page */}
 *       <PrivacySettingsPage />
 *     </>
 *   )
 * }
 */

// Export all components
export { PrivacySettingsPage, PrivacyPanel, PrivacyModal, usePrivacySettings }
