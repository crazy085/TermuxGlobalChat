# Design Guidelines: Person-to-Person Messaging Application

## Design Approach
**Reference-Based Approach** - Drawing inspiration from WhatsApp, Telegram, and Signal messaging interfaces, prioritizing clarity, efficiency, and familiar messaging patterns.

## Core Design Principles
1. **Messaging-First Interface** - Remove all distractions, focus entirely on conversations
2. **Scan-ability** - Quick identification of contacts and message threads
3. **Mobile-Optimized** - Touch-friendly targets, thumb-zone consideration
4. **Instant Clarity** - No learning curve for core messaging functions

---

## Typography System

**Font Stack:** Inter or System UI (-apple-system, BlinkMacSystemFont)

**Hierarchy:**
- Contact Names: font-semibold text-base
- Message Text: font-normal text-sm
- Timestamps: font-normal text-xs
- Input Field: font-normal text-base
- Username/Headers: font-semibold text-lg

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 3, 4, 6, and 8
- Tight spacing: p-2, gap-2
- Standard spacing: p-4, gap-4, m-4
- Section spacing: p-6, py-8

**Grid Structure:**
- Desktop: Two-column layout (contact sidebar + chat area)
- Tablet: Collapsible sidebar or stacked
- Mobile: Single view with navigation between contacts and chat

**Breakpoints:**
- Mobile: < 768px (single column, navigation toggle)
- Desktop: ≥ 768px (two-column split layout)

---

## Component Library

### 1. Contact List Sidebar
**Layout:** Fixed left sidebar (w-80 on desktop, full-width on mobile)
- Header with username display and settings icon
- Search bar for filtering contacts (h-10, rounded-lg)
- Scrollable contact list
- Each contact item: flex layout, h-16, hover state, active state for selected
- Contact avatar (w-10 h-10, rounded-full)
- Contact name + last message preview (truncate text)
- Unread badge indicator (absolute positioning, top-right)

### 2. Chat Area
**Layout:** Flex-grow container
- Header bar: Contact name, status indicator, fixed height h-16
- Messages container: flex-1, overflow-y-auto, p-4
- Input area: Fixed bottom, h-16, border-top

### 3. Message Bubbles
**Structure:**
- Sent messages: ml-auto, max-w-md (align right)
- Received messages: mr-auto, max-w-md (align left)
- Padding: px-4 py-2
- Border radius: rounded-2xl (sent), rounded-2xl (received)
- Timestamp: text-xs, mt-1, opacity-70
- Read status: Small checkmark icons, absolute positioning

**Layout Pattern:**
```
[Received bubble - left aligned]
    Message text here
    10:34 AM

                [Sent bubble - right aligned]
                Your message
                10:35 AM ✓✓
```

### 4. Message Input
**Components:**
- Text input field: flex-1, rounded-full, px-4, h-12
- Send button: w-12 h-12, rounded-full, ml-2
- Icon: Paper plane or send arrow (24px)

### 5. Empty States
- No chat selected: Centered illustration + text
- No contacts: "Start a conversation" prompt
- No messages: "Say hello" prompt

### 6. User Registration/Login
**Minimal modal or dedicated page:**
- Username input field (max-w-sm, mx-auto)
- Submit button (w-full)
- Centered layout, py-12

---

## Navigation & Interaction Patterns

**Desktop Flow:**
- Contact list always visible on left
- Click contact → loads chat on right
- Active contact highlighted in sidebar

**Mobile Flow:**
- Default view: Contact list
- Tap contact → Navigate to full-screen chat
- Back button returns to contact list
- Hamburger/back icon for navigation

**Real-time Updates:**
- New message: Append to bottom, auto-scroll
- Typing indicator: Small animated dots below last message
- Online status: Small dot next to avatar (green = online)

---

## Responsive Behavior

**Mobile (< 768px):**
- Single-column stacked layout
- Contact list fills screen OR chat fills screen
- Smooth slide transitions between views
- Bottom-fixed input bar with safe-area padding

**Desktop (≥ 768px):**
- Two-column split: 320px sidebar + flex-grow chat
- Sidebar fixed, chat area scrollable
- Hover states on all interactive elements

---

## Images
**No hero images required** - This is a utility application focused on messaging efficiency.

**Avatar Placeholders:**
- Use generated initial avatars (first letter of username)
- Circular shape, w-10 h-10 for list, w-12 h-12 for chat header
- Consistent sizing throughout interface

---

## Accessibility
- Focus states on all interactive elements (ring-2)
- Keyboard navigation for contact list (arrow keys)
- Enter to send message
- Alt text for status indicators
- Sufficient touch targets: minimum h-12 for tappable elements
- ARIA labels for icon buttons

---

## Performance Optimizations
- Virtual scrolling for large contact lists
- Lazy load message history
- Optimize WebSocket payload size
- Minimal animations (subtle fade-ins only)