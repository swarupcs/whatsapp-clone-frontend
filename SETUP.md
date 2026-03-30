# WhatsUp Frontend — Setup Guide

## Architecture

```
Service Layer        → API calls (src/services/*.service.ts)
    ↓
Query Hooks          → TanStack Query wrappers (src/hooks/queries/*.ts)
    ↓
UI Hooks             → Scroll, typing etc (src/hooks/*.ts)
    ↓
Components / Pages   → Consume hooks only, zero fetch() calls
```

## Quick Start

### 1. Backend first

```bash
cd whatsapp-backend
pnpm install
cp .env.example .env        # edit JWT secrets before production
pnpm dev                    # http://localhost:5000
```

Seed accounts (password: `password123`):
`john@example.com`, `jane@example.com`, `mike@example.com`, `sarah@example.com`, `alex@example.com`

### 2. Frontend

```bash
cd whatsapp-frontend
pnpm install
pnpm dev                    # http://localhost:5173
```

The `.env` file is already configured for localhost.

---

## File Map — What's New vs Original

### New files added

| File | Purpose |
|---|---|
| `src/types/index.ts` | Single source of truth for all TypeScript types |
| `src/lib/http.ts` | Typed fetch client with silent JWT refresh |
| `src/lib/socket.ts` | Typed Socket.IO client |
| `src/services/auth.service.ts` | Auth API calls |
| `src/services/user.service.ts` | User API calls |
| `src/services/conversation.service.ts` | Conversation API calls |
| `src/services/message.service.ts` | Message API calls |
| `src/hooks/queries/useAuth.ts` | TanStack Query auth hooks |
| `src/hooks/queries/useUsers.ts` | TanStack Query user hooks |
| `src/hooks/queries/useConversations.ts` | TanStack Query conversation hooks |
| `src/hooks/queries/useMessages.ts` | TanStack Query message hooks (infinite scroll) |
| `src/hooks/useTyping.ts` | Debounced typing emitter |
| `src/hooks/useScrollMessages.ts` | IntersectionObserver load-more + seen |
| `src/store/authStore.ts` | Auth-only Zustand store (replaces full chatStore auth) |
| `src/store/callStore.ts` | Call state (unchanged logic, typed) |

### Replaced files

| File | Changes |
|---|---|
| `src/store/chatStore.ts` | Now UI-only state (active conv, typing, online). No API calls |
| `src/context/SocketContext.tsx` | Wires socket events directly into React Query cache |
| `src/App.tsx` | Uses authStore for guards, adds QueryClient |
| `src/components/auth/LoginForm.tsx` | Uses `useLogin` mutation hook |
| `src/components/auth/RegisterForm.tsx` | Uses `useRegister` mutation hook |
| `src/components/chat/ChatSidebar.tsx` | Uses `useConversations` query, no mock data |
| `src/components/chat/ChatArea.tsx` | Uses all message hooks, infinite scroll |
| `src/components/chat/PinnedMessagesBar.tsx` | Uses `usePinnedMessages` query |
| `src/components/chat/CreateGroupModal.tsx` | Uses `useUserSearch` + `useCreateGroup` |
| `src/components/chat/UserSearchModal.tsx` | Uses `useUserSearch` + `useCreateDirectConversation` |
| `src/components/chat/MessageSearchModal.tsx` | Uses `useGlobalMessageSearch` real API |
| `src/components/chat/ForwardMessageModal.tsx` | Uses `useConversations` + `useForwardMessage` |
| `src/components/chat/UndoToast.tsx` | Uses query cache for undo |
| `src/pages/Home.tsx` | Cleaned up, uses new stores |
| `src/pages/Profile.tsx` | Uses `useUpdateProfile` + `useUpdateStatus` hooks |

### Unchanged files (keep from original project)

All other components in `src/components/chat/` that aren't listed above are **unchanged** — copy them directly from your original project:

- `AudioCallModal.tsx`
- `AudioMessage.tsx`
- `AttachmentPreview.tsx`
- `ConversationSearch.tsx`
- `EmojiPicker.tsx`
- `FilePreviewScreen.tsx`
- `ImagePreviewModal.tsx`
- `IncomingCallModal.tsx`
- `MessageActions.tsx`
- `MessageReactions.tsx`
- `MessageStatus.tsx`
- `NotificationPermission.tsx`
- `QuotedMessage.tsx`
- `ReactionPicker.tsx`
- `ReadReceipts.tsx`
- `ReplyPreview.tsx`
- `TypingIndicator.tsx`
- `VideoCallModal.tsx`
- `VoiceRecorder.tsx`

Also copy unchanged:
- `src/lib/fileUtils.ts`
- `src/lib/notifications.ts`
- `src/lib/utils.ts`
- `src/hooks/use-mobile.ts`
- `src/pages/Settings.tsx`
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/pages/NotFound.tsx`
- `src/index.css`
- `src/main.tsx`
- `src/components/NavLink.tsx`
- All `src/components/ui/*` files

---

## Data Flow

### Sending a message

```
User types → Input onChange → useTyping.handleInputChange → socket typing event
User presses Enter → handleSend() → useSendMessage.mutate()
  → optimistic message appended to React Query cache
  → messageService.send() / messageService.sendWithFiles()
  → on success: optimistic replaced with real message
  → on error: optimistic removed, toast shown
```

### Receiving a message (socket)

```
Server emits "new_message" → SocketContext listener
  → queryClient.setQueryData(messageKeys.list(convId)) ← appends to cache
  → queryClient.setQueryData(conversationKeys.all) ← updates latest message
  → if background: notificationService.showNotification()
```

### Auth flow

```
Login form → useLogin.mutateAsync()
  → authService.login() → POST /api/auth/login
  → tokenStorage.setTokens() → localStorage
  → authStore.setAuth() → Zustand
  → queryClient.setQueryData(authKeys.me) ← pre-populate cache
  → navigate('/')
```

### Token refresh

```
Any 401 response → http.ts silent refresh
  → POST /api/auth/refresh with refreshToken
  → tokenStorage.setTokens() with new tokens
  → retry original request
  → if refresh fails: window.dispatchEvent('auth:expired') + redirect to /login
```
