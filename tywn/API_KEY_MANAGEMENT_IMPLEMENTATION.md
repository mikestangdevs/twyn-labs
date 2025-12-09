# API Key Management Feature

## Overview
Created a comprehensive API key management interface as a dedicated tab in the main navigation (not buried in settings), inspired by OpenRouter's design.

## Files Created

### 1. `/twyn-frontend/src/components/ui/table.tsx`
- Created table component using shadcn/ui patterns
- Includes: Table, TableHeader, TableBody, TableRow, TableHead, TableCell components
- Styled with proper hover states and responsive design

### 2. `/twyn-frontend/src/services/apiKeyService.ts`
- Service for managing API keys
- Functions:
  - `listKeys()` - List all API keys for current user's tenant
  - `createKey(request)` - Create new API key with name and rate limit
  - `revokeKey(keyId)` - Deactivate an API key
  - `deleteKey(keyId)` - Permanently delete an API key
- Features:
  - Automatic API key generation with `sk-twyn-` prefix
  - SHA-256 hashing for secure storage
  - Tenant isolation (users can only manage their own keys)

### 3. `/twyn-frontend/src/app/api-keys/page.tsx`
- Main API keys page with full management UI
- Features:
  - Clean table displaying API keys with columns: Key, Usage, Limit
  - "Create API Key" button (styled with indigo theme)
  - Create key dialog with:
    - Name input
    - Rate limit configuration (1-10000 requests/hour)
  - Key display dialog:
    - Shows new API key only once
    - Toggle visibility (eye icon)
    - Copy to clipboard functionality
    - Warning that key won't be shown again
  - Key management:
    - Three-dot menu for each key
    - Delete confirmation dialog
    - Shows key status (active/inactive)
    - Shows usage statistics
    - Shows when key was created and last used
  - Empty state when no keys exist
  - Loading skeletons during data fetch

### 4. `/twyn-frontend/src/app/api-keys/layout.tsx`
- API keys page layout with sidebar
- Same layout as sim pages for consistency
- Includes all necessary providers (UserProvider, SimulationHistoryProvider, etc.)

## Files Modified

### `/twyn-frontend/src/components/nav-main.tsx`
- Added "API Keys" button to main navigation (below "New sim")
- Shows key icon + "API Keys" label when sidebar is expanded
- Shows only key icon when sidebar is collapsed
- Clicking navigates to `/api-keys`

### `/twyn-frontend/src/components/nav-user.tsx`
- Removed the "Settings" menu item (no longer needed)
- Reverted to original user dropdown menu

### `/twyn-frontend/src/services/index.ts`
- Exported APIKeyService and related types
- Makes service available throughout the app

## Navigation

### Direct Access (Primary Method)
- API Keys button is visible in the main sidebar navigation
- Located below the "New sim" button
- Click to navigate to `/api-keys`
- Always visible (not hidden in a menu)

### When Sidebar is Expanded:
- Shows key icon + "API Keys" text

### When Sidebar is Collapsed:
- Shows only key icon with tooltip on hover

## Key Features

### Security
- API keys are generated client-side with crypto.getRandomValues
- Keys are hashed with SHA-256 before storage
- Only the hash is stored in the database
- Full key is shown only once upon creation
- Tenant isolation - users can only see/manage their own keys

### UX Highlights
- Masked key display (e.g., `sk-...abc123`)
- Copy to clipboard with toast notification
- Toggle key visibility in creation dialog
- Time-ago formatting for created/last used dates
- Loading states with skeleton placeholders
- Empty state messaging
- Confirmation dialogs for destructive actions
- Indigo accent color matching OpenRouter design
- Info icon (ⓘ) next to subtitle for additional context

### Rate Limiting
- Configurable per-key rate limits (1-10000 requests/hour)
- Displayed as dual badges: "1000/hr TOTAL" or "unlimited TOTAL"

### Usage Tracking
- Shows total request count per key
- Shows last used timestamp
- Formatted as relative time (e.g., "2 hours ago")

## Database Schema
Uses existing table from migration `002_add_api_keys.sql`:
- `api_keys` table with columns:
  - `key_id` - Unique identifier
  - `key_hash` - SHA-256 hash of actual key
  - `tenant_id` - For multi-tenancy
  - `name` - Human-readable name
  - `is_active` - Active/inactive status
  - `rate_limit` - Requests per hour limit
  - `usage_count` - Total usage counter
  - `created_at` - Creation timestamp
  - `expires_at` - Optional expiration
  - `last_used_at` - Last usage timestamp
  - `metadata` - Additional JSON data

## UI Components Used
- Button
- Dialog (for create and display)
- AlertDialog (for delete confirmation)
- Table (custom component)
- Input, Label
- Badge
- Skeleton (loading states)
- DropdownMenu
- Sonner toast notifications
- Lucide icons: Key, MoreVertical, Copy, Eye, EyeOff, Info

## Backend Integration
The frontend directly uses Supabase client to interact with the `api_keys` table. The backend at `twyn-backend/src/api/routes/v1/keys.py` also provides API endpoints for programmatic access, but the UI uses direct database access for simplicity.

## Design Decisions

### Why a Separate Tab?
- **Visibility**: API keys are a core feature, not a secondary setting
- **Accessibility**: Users need quick access without navigating through menus
- **Context**: Keeps API key management in the same context as simulations
- **Prominence**: Signals that API keys are important for the platform

### OpenRouter Design Inspiration
- Clean table layout with subtle borders
- Indigo accent color for primary actions
- "unlimited TOTAL" badge format matching their style
- Masked key display for security
- Three-dot menu for actions
- Comprehensive key metadata display

## Future Enhancements
- Integrate with backend V1 API endpoints for consistency
- Add API key expiration date setting
- Show usage charts/analytics
- Add API key permissions/scopes
- Key rotation functionality
- Usage alerts when approaching rate limits
- Export usage reports
