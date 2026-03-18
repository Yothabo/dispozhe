# Driflly Venue Mode
## Complete Concept, Architecture, and Implementation Specification

**Version:** 2.0
**Date:** March 2026
**Status:** Design Specification — Ready for Implementation
**Author:** Yothabo

---

## Table of Contents

1. [Overview](#1-overview)
2. [How It Differs From Duo Mode](#2-how-it-differs-from-duo-mode)
3. [Ephemerality and Security Model](#3-ephemerality-and-security-model)
4. [Encryption Architecture](#4-encryption-architecture)
5. [Session Lifecycle](#5-session-lifecycle)
6. [Admin System](#6-admin-system)
7. [The Three-Tab Interface](#7-the-three-tab-interface)
8. [Photo System](#8-photo-system)
9. [AI Analysis Pipeline](#9-ai-analysis-pipeline)
10. [Post-Event Delivery](#10-post-event-delivery)
11. [Physical Access: The Permanent QR](#11-physical-access-the-permanent-qr)
12. [Consent and Disclosure](#12-consent-and-disclosure)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Backend Implementation](#14-backend-implementation)
15. [Frontend Implementation](#15-frontend-implementation)
16. [Data Flow Summary](#16-data-flow-summary)

---

## 1. Overview

Venue Mode is a direct extension of Driflly's existing session architecture into the live events space. It takes the same ephemeral, zero-friction model that powers Duo and scales it into a shared, multi-participant environment with three distinct interaction layers: a live chat, a photo gallery, and a structured announcements feed.

The organiser creates a session before the event, sets the programme and event information, and receives a permanent QR code they print and display at the venue. On the day, attendees scan the QR and are dropped directly into the session. No app. No account. No setup. The session runs for its configured duration, then self-destructs — delivering the organiser a full AI report and photo gallery export to their email before everything is permanently deleted.

Designed for public events with 20 to 500 concurrent attendees: conferences, festivals, markets, weddings, club nights, campus events, community gatherings.

---

## 2. How It Differs From Duo Mode

Venue Mode shares the same core primitives as Duo — session creation, key generation, QR join, WebSocket relay, expiry and termination — but differs in four ways.

**Scale:** Duo is two participants. Venue Mode is up to 500.

**Session preparation:** Duo sessions are created moments before use. Venue sessions are created days or weeks in advance, sit in a scheduled state, and go live automatically at the configured start time.

**Permanent QR:** Duo QR codes are tied to a single join flow. The Venue QR is permanent — it never changes and can be printed before the event.

**Interface:** Duo has one screen: the chat. Venue Mode has three tabs: Chat, Gallery, and Announcements. The organiser participates in the same interface as attendees but with elevated write access.

Everything else — key generation, WebSocket relay, replay protection, ephemeral termination — is inherited directly from the existing codebase.

---

## 3. Ephemerality and Security Model

### What Is Preserved

Participant anonymity is fully preserved. No name, phone number, email address, or device identifier is collected. Each attendee receives an anonymous session token on join. Two attendees cannot identify each other through the system.

Zero persistent message storage. Messages are relayed through the WebSocket layer and never written to the database. The server forwards ciphertext it cannot read.

Complete deletion at session end. All session data — chat history, gallery URLs in Redis, session tokens — is permanently deleted when the session terminates.

### What Is Different From Duo

In Duo mode the session key never reaches the server after the join phase. In Venue Mode, because the QR is public and permanent, the session key must be held in server memory for the event duration to distribute to each new attendee on join. The key is deleted at session end alongside all other data.

The security model is: messages are end-to-end encrypted between clients. The server distributes the session key over TLS on join and holds it only for that purpose. A server operator with database access cannot read messages because messages are not stored. This is the honest trade-off for public QR access and is documented in the consent disclosure.

### Threat Model

| Threat | Protected? | Mechanism |
|---|---|---|
| Network eavesdropper | Yes | TLS + AES-256-GCM E2EE |
| Server reading stored messages | Yes | Messages never stored |
| Server extracting session key | Partial | Key in memory only, deleted at end |
| Random attendee gaining admin access | Yes | Separate admin token, not in public QR |
| Co-admin invite reuse | Yes | One-time consumption, server-enforced |
| Photo access after event | Yes | Cloudinary deleted after export |
| Attendee identity exposure | Yes | No identity collected |

---

## 4. Encryption Architecture

### Session Key Distribution

The organiser creates the Venue session. The system generates an AES-256-GCM session key using crypto.subtle.generateKey() — identical to Duo mode. This key is stored server-side in memory only for the duration of the event, for the sole purpose of distributing it to attendees on join.

When an attendee scans the public QR and hits the join endpoint, the server returns the session key in the HTTPS response body. The attendee's browser imports it using crypto.subtle.importKey() and stores it in memory only. All messages sent in the Chat tab are encrypted with this key before transmission using the same AES-256-GCM + HMAC-SHA256 + sequence + nonce pipeline as Duo mode.

Gallery photo URLs are not encrypted — they are Cloudinary URLs ephemeral through deletion, not encryption. Announcement content is stored in Redis in plaintext with a TTL matching the session duration, as it is public event information.

### Admin Token

The admin token is a separate credential — a cryptographically random 32-byte string, base64-encoded. It does not grant access to the session key. It grants write permissions to Announcements, Programme endpoints, moderation capabilities, and the ability to end the session.

The admin token is delivered to the organiser in the private admin QR, embedded in the URL fragment. Fragments are not transmitted in HTTP requests — the server never sees the admin token in a URL log. The client extracts it and includes it in the WebSocket handshake header.

---

## 5. Session Lifecycle

### States

```
created -> scheduled -> live -> ending -> deleted
```

**created:** Session record exists. Keys generated. Public QR and admin QR ready. Not yet accessible to attendees.

**scheduled:** Between creation and configured start time. Public QR shows a waiting screen. Organiser can join in admin mode to edit programme.

**live:** Start time reached. Attendees can join. Session runs for configured duration.

**ending:** Organiser ends session or timer expires. New joins rejected. All connected clients receive a session_ending event with a 60-second grace window for in-progress uploads. AI and gallery export workers triggered.

**deleted:** Report and gallery delivered to organiser email. All data purged. Public QR shows a session-ended screen.

### Pre-Event Setup Flow

```
Organiser provides:
  - Event name and description
  - Programme items (title, time, description, speaker)
  - Session duration (30 minutes minimum, 3 days maximum)
  - Start date and time
  - Organiser email

System generates:
  - session_id
  - session_key (AES-256-GCM, 256-bit, memory only)
  - public_qr  -> https://driflly.app/venue/{session_id}
  - admin_qr   -> https://driflly.app/venue/{session_id}/admin#{admin_token}
  - High-resolution PNG downloads for both QR codes
```

The organiser prints the public QR and displays it at the venue. The admin QR is kept private.

---

## 6. Admin System

### Organiser Access

The organiser scans the admin QR on event day. The admin token in the URL fragment is extracted client-side and included in the WebSocket connection handshake. The server validates it against the stored hashed admin token for the session.

The organiser's interface is identical to the attendee interface with two additions: a message type selector in the Chat tab, and write access to the Announcements tab.

### Message Types for Admins

When an admin composes a message, a simple type selector appears above the keyboard:

| Type | Behaviour |
|---|---|
| Message | Standard chat message in the chat flow, with admin badge |
| Announcement | Posted to Announcements tab + full-screen dismissible banner on all attendee screens |
| Programme Update | Updates a specific programme item + quiet badge notification on Announcements tab |

### Co-Admin Invites

The organiser generates a co-admin invite from within the session (long-press admin badge, select Invite co-admin). The system generates a one-time invite using the existing Driflly code mechanism: a 6-digit code or one-time link with configurable expiry (5 minutes, 30 minutes, or until used). Single-use, server-enforced. The organiser can revoke any co-admin at any time.

When a co-admin redeems their invite, their session token is elevated to admin level. They gain the message type selector and Announcements write access. Only the original organiser can generate further co-admin invites.

### Admin Capabilities

| Capability | Organiser | Co-Admin | Attendee |
|---|---|---|---|
| Send chat messages | Yes | Yes | Yes |
| Post announcements | Yes | Yes | No |
| Edit programme | Yes | Yes | No |
| Delete any message | Yes | Yes | No |
| Mute attendee token | Yes | Yes | No |
| Feature gallery photo | Yes | Yes | No |
| Generate co-admin invite | Yes | No | No |
| End session | Yes | No | No |

---

## 7. The Three-Tab Interface

### Tab 1: Chat

The primary interaction layer. All participants send and receive messages here. Functionally identical to Duo mode chat with two additions.

**View-once photos in chat.** Attendees can send a photo in the chat marked as view-once. The recipient views it once and it is gone — never stored in the gallery, never sent to Cloudinary. Uses the existing Driflly view-once mechanism unchanged.

**Admin message badge.** Admin messages appear with a subtle event badge so attendees can distinguish host responses from general discussion.

**Message display limit.** The last 100 messages are visible. This bounds the in-memory message display and keeps the chat navigable at large events.

### Tab 2: Gallery

A live photo feed for the event. Attendees contribute photos visible to everyone in the session.

Attendee taps the Gallery tab, taps the camera icon, selects or captures a photo. The photo is resized client-side then uploaded directly to Cloudinary — it never touches Driflly's servers. Cloudinary returns a URL. The URL is broadcast to all connected clients via WebSocket. Each connected browser fetches the image and stores it in IndexedDB under the event ID.

Photos load from the attendee's local IndexedDB — instant, no network request after initial fetch. An attendee who joins mid-event sees only photos posted after they arrived, consistent with chat behaviour.

Admins can long-press any gallery photo and mark it as featured. Featured photos appear at the top of the gallery grid.

### Tab 3: Announcements

The structured information layer. Admins write here; attendees read only.

A chronological list of all announcements posted during the event. Each announcement is permanently visible for the full session duration. Attendees can scroll through the full announcement history.

The live programme section at the top of the tab shows the current item highlighted with upcoming items listed below. When a programme update is posted, all connected attendees receive a quiet badge notification on the tab icon.

---

## 8. Photo System

### Upload Flow

```
Attendee selects photo
        |
        v
Client-side resize to max 1200px on longest edge
        |
        v
Direct upload to Cloudinary unsigned upload endpoint
(photo never touches Driflly servers)
        |
        v
Cloudinary returns secure_url
        |
        v
Client sends WebSocket message:
{type: "gallery", url: "https://res.cloudinary.com/...", timestamp: ...}
        |
        v
Server validates session, validates URL is Cloudinary origin,
stores URL in Redis (session TTL), broadcasts to all clients
        |
        v
Each client fetches image and stores in IndexedDB:
key: gallery:{session_id}:{timestamp}
```

### IndexedDB Schema

```javascript
// Database: driflly_venue
// Object store: gallery_photos

{
  key:        "gallery:{session_id}:{timestamp}",
  session_id: string,
  url:        string,
  timestamp:  number,
  featured:   boolean
}
```

### View-Once Photos in Chat

View-once photos in Chat follow the existing Driflly implementation. Transmitted as encrypted WebSocket payloads, not uploaded to Cloudinary. Never stored in IndexedDB. The recipient's client marks them viewed after display and removes them from the message thread.

### Post-Event Gallery Export

When the session ends the export worker retrieves all Cloudinary URLs from Redis, downloads each image, compiles a zip named {event_name}_gallery_{date}.zip, attaches it to the post-event email, calls the Cloudinary delete API for every image in the session folder, and clears the Redis gallery URL store.

---

## 9. AI Analysis Pipeline

### Design Constraint

The AI pipeline minimises token usage through a two-stage system: the AI never receives raw messages — it receives pre-aggregated compact summaries.

### Stage 1: Batch Collection Every 30 Minutes (Zero AI, Zero Cost)

A background job runs every 30 minutes. It collects all messages from the last window, counts and categorises them, and stores a compact summary in Redis. No API calls. Pure Python string processing.

```python
# Example batch summary stored in Redis
{
  "window":        "14:00-14:30",
  "message_count": 87,
  "photo_count":   12,
  "question_count": 8,
  "reaction_count": 34,
  "top_words":     ["speech", "beautiful", "food", "music", "queue"]
}
```

For a 4-hour event this produces 8 batch summaries. Total cost: $0.00.

### Stage 2: Live Admin Indicator (Zero AI, Zero Cost)

The organiser sees a subtle live pulse indicator in their interface. This reads the latest batch summary from Redis — no API call, just reading a cached JSON object.

### Stage 3: Post-Event Report (One API Call)

When the session ends, one structured prompt receives all 8 batch summaries as input. The AI never sees raw messages — only the compact summaries.

```
ANALYSIS_PROMPT:

You are analysing an event called "{event_name}" that ran for {duration}.
Programme: {programme_items}

Below are 30-minute activity summaries. Each contains message count,
photo contributions, question volume, and top words mentioned.
Do not invent details not present in the data.

Summaries:
{batch_summaries}

Produce a structured report:

1. OVERALL ENGAGEMENT
   Total participation, peak activity period, quietest period.
   Cross-reference with programme where possible.

2. SENTIMENT ARC
   How energy and engagement shifted across the event timeline.
   Notable spikes or drops correlated with programme items.

3. TOP THEMES
   What attendees discussed most. Any recurring concerns.

4. PHOTO MOMENTS
   Which programme periods generated most photo contributions.
   What this suggests about emotional engagement.

5. OPERATIONAL NOTES
   Any words suggesting concerns (queue, wait, loud, cold, lost).
   Recommended actions for future events.

6. HIGHLIGHTS
   Two or three standout moments from the event data.

Keep the report professional and actionable.
Do not reference or quote individual messages.
Describe patterns only.
```

### Token Budget Per Event

| Operation | Frequency | Tokens | Cost |
|---|---|---|---|
| Batch collection | Every 30 min | 0 | $0.00 |
| Live admin indicator | Continuous | 0 | $0.00 |
| Post-event report | Once | ~3,500 | <$0.01 |
| **Total per event** | | **~3,500** | **<$0.01** |

---

## 10. Post-Event Delivery

### Trigger

Session ends (organiser action or timer expiry). The ending state is entered. The delivery pipeline is triggered automatically after the 60-second grace window.

### Pipeline

```
Session ends
      |
      v
60-second grace window (attendees notified, uploads complete)
      |
      v
Final batch collection (last incomplete 30-minute window)
      |
      v
AI analysis (one API call, batch summaries as input)
      |
      v
PDF report generated from structured AI output
      |
      v
Gallery zip compiled (download from Cloudinary, package)
      |
      v
Email sent to organiser: PDF report + gallery zip attached
      |
      v
All Cloudinary images deleted
All Redis keys deleted (batches, gallery URLs, announcements)
Session key deleted from memory
IndexedDB cleared on all connected clients
Session record marked deleted_at
      |
      v
Deletion confirmation email sent to organiser
```

### Email 1 — Report and Gallery

```
Subject: Your Driflly Venue Report — {event_name}

Your event "{event_name}" has ended. Attached:

1. {event_name}_report.pdf
2. {event_name}_gallery.zip ({n} photos)

All data will be permanently deleted from Driflly's
servers within 24 hours.

— Driflly
```

### Email 2 — Deletion Confirmation

```
Subject: Data Deletion Confirmed — {event_name}

All data from "{event_name}" has been permanently deleted
from Driflly's servers as of {timestamp}.

This includes all messages, photos, session tokens,
and event metadata.

— Driflly
```

---

## 11. Physical Access: The Permanent QR

### Why It Is Permanent

The Venue QR encodes a stable session URL: https://driflly.app/venue/{session_id}. The session ID never changes. The organiser generates the QR weeks before the event, prints it at any size, and it works on event day without modification.

### What Each QR Encodes

```
Public QR:  https://driflly.app/venue/{session_id}
Admin QR:   https://driflly.app/venue/{session_id}/admin#{admin_token}
```

The admin token lives in the URL fragment of the admin QR. Fragments are not transmitted in HTTP requests — server logs never contain the admin token.

### QR Behaviour by Session State

| State | Public QR resolves to |
|---|---|
| created | Session not yet active screen |
| scheduled | This event begins [date] at [time] |
| live | Consent screen then direct join |
| ending | This event is ending, joins rejected |
| deleted | This event has ended |

QR codes are generated at 2000x2000 pixels, Error Correction Level M, suitable for printing at any size up to A1.

---

## 12. Consent and Disclosure

Every attendee sees this screen before entering. The Enter Event button does not appear until the full text is visible on screen.

```
[Event Name]
Powered by Driflly Venue Mode

This is a temporary, anonymous event channel.

- No account is required
- No personal information is collected
- Your messages are end-to-end encrypted
- Photos you share in the Gallery may be
  included in the organiser's event archive
- All data is permanently deleted within
  24 hours of the event ending

This is not a private messaging system.
Do not share sensitive personal information.

[  Enter Event  ]
```

---

## 13. Implementation Roadmap

### Phase 1: Core Venue Session (Weeks 1-3)

Goal: Venue session creation, permanent QR, scheduled to live transition, basic multi-participant chat.

- Add venue fields to sessions schema (event_name, programme, starts_at, organiser_email, admin_token)
- Build VenueSessionService extending existing SessionService
- Implement scheduled to live automatic state transition via background scheduler
- Generate permanent public QR and admin QR at creation
- Build public join endpoint distributing session key on scan
- Build admin join endpoint validating admin token from URL fragment
- Extend WebSocketManager to support unlimited participants per session
- Build waiting screen for scheduled state

Done when: Organiser creates session with programme. Participants join via QR. Chat functions. Admin badge visible. Session expires and data clears.

### Phase 2: Announcements Tab and Admin Controls (Weeks 4-5)

Goal: Functional Announcements tab with programme and admin message types.

- Build Announcements tab with programme strip and announcements feed
- Build admin message type selector (Message, Announcement, Programme Update)
- Implement announcement banner broadcast (full-screen dismissible overlay)
- Implement programme update notification (badge on tab icon)
- Build co-admin invite flow using existing one-time code mechanism
- Implement admin moderation controls (delete message, mute token)
- Store announcements in Redis with session TTL

Done when: Organiser posts announcement, all attendees see banner. Programme displays and updates live. Co-admin invite works end-to-end.

### Phase 3: Gallery Tab and Photo System (Weeks 6-8)

Goal: Gallery tab with Cloudinary upload, IndexedDB local storage, and view-once chat photos.

- Integrate Cloudinary unsigned upload API
- Build client-side photo resize before upload
- Build Gallery tab with live photo grid
- Implement IndexedDB store for gallery photos
- Implement gallery WebSocket broadcast (URL distribution)
- Build featured photo toggle for admins
- Implement view-once photo in Chat tab (existing mechanism)
- Implement gallery URL store in Redis with session TTL
- Load test: 50 concurrent photo uploads

Done when: Attendee uploads photo, it appears in Gallery for all attendees within 3 seconds. Photos persist in IndexedDB on page refresh. View-once photos self-destruct.

### Phase 4: AI Pipeline and Post-Event Delivery (Weeks 9-11)

Goal: Batch collection, post-event AI analysis, PDF report, gallery zip, email delivery, deletion.

- Build 30-minute batch collection background job (no AI)
- Build live admin indicator reading latest batch summary
- Build post-event AI prompt and single API call
- Build PDF report generation from structured AI output
- Build gallery zip compilation from Cloudinary URLs
- Integrate email delivery (SMTP or SendGrid)
- Build Cloudinary bulk delete after export
- Build deletion confirmation email
- Build complete post-event pipeline as atomic async job
- End-to-end test with synthetic 4-hour event data

Done when: Session ends, report PDF and gallery zip delivered to organiser email within 1 hour. All Cloudinary images deleted. All Redis data cleared. Deletion confirmation sent.

### Phase 5: Polish and Launch (Weeks 12-14)

Goal: 500-participant load test, UX polish, first real event.

- 500-participant WebSocket load test
- Connection pool tuning for venue scale
- IndexedDB performance test with 200+ photos
- Consent screen review
- Organiser session creation UX polish
- QR code download and printing guide
- First real partner event (observed)
- Issues resolved and public availability

---

## 14. Backend Implementation

### Schema Extension

```sql
ALTER TABLE sessions ADD COLUMN session_type    TEXT DEFAULT 'duo';
ALTER TABLE sessions ADD COLUMN event_name      TEXT;
ALTER TABLE sessions ADD COLUMN programme       JSONB;
ALTER TABLE sessions ADD COLUMN starts_at       TIMESTAMP;
ALTER TABLE sessions ADD COLUMN organiser_email TEXT;
ALTER TABLE sessions ADD COLUMN admin_token     TEXT;  -- SHA-256 hashed

CREATE TABLE venue_batches (
  id           SERIAL PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES sessions(id),
  window_start TIMESTAMP NOT NULL,
  window_end   TIMESTAMP NOT NULL,
  summary      JSONB NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

### Venue Router

```python
# backend/routes/venue.py

from fastapi import APIRouter, HTTPException, WebSocket
from services.venue_session_service import VenueSessionService
from services.qr_service import QRService
import hashlib, secrets

router = APIRouter(prefix="/venue", tags=["venue"])

@router.post("/create")
async def create_venue_session(request: VenueCreateRequest):
    session_id  = VenueSessionService.create(request)
    admin_token = secrets.token_urlsafe(32)
    VenueSessionService.store_admin_token(
        session_id,
        hashlib.sha256(admin_token.encode()).hexdigest()
    )
    public_qr = QRService.generate(
        f"https://driflly.app/venue/{session_id}"
    )
    admin_qr = QRService.generate(
        f"https://driflly.app/venue/{session_id}/admin#{admin_token}"
    )
    return {
        "session_id":  session_id,
        "public_qr":   public_qr,
        "admin_qr":    admin_qr,
        "session_key": VenueSessionService.get_session_key(session_id)
    }

@router.get("/{session_id}/join")
async def join_venue(session_id: str):
    session = VenueSessionService.get_live(session_id)
    if not session:
        raise HTTPException(404, detail="Session not found or not live")
    token = secrets.token_urlsafe(16)
    return {
        "token":       token,
        "session_key": VenueSessionService.get_session_key(session_id),
        "event_name":  session.event_name,
        "programme":   session.programme
    }

@router.websocket("/{session_id}/ws")
async def venue_websocket(websocket: WebSocket, session_id: str):
    token       = websocket.headers.get("X-Session-Token")
    admin_token = websocket.headers.get("X-Admin-Token")
    is_admin    = VenueSessionService.validate_admin_token(
        session_id, admin_token
    ) if admin_token else False
    await venue_ws_manager.connect(websocket, session_id, token, is_admin)
    try:
        while True:
            data = await websocket.receive_json()
            await venue_ws_manager.handle_message(
                websocket, session_id, token, is_admin, data
            )
    except WebSocketDisconnect:
        await venue_ws_manager.disconnect(websocket, session_id, token)
```

### Venue WebSocket Manager

```python
# backend/services/venue_ws_manager.py

class VenueWebSocketManager:
    def __init__(self):
        self.connections: Dict[str, list] = {}
        self.replay       = ReplayProtection()
        self.rate_limiter = RateLimiter()

    async def handle_message(self, ws, session_id, token, is_admin, data):
        msg_type = data.get("type")

        if msg_type == "chat":
            await self._handle_chat(ws, session_id, token, data)

        elif msg_type == "announcement" and is_admin:
            await self._handle_announcement(session_id, data)

        elif msg_type == "programme_update" and is_admin:
            await self._handle_programme_update(session_id, data)

        elif msg_type == "gallery":
            await self._handle_gallery(session_id, token, data)

        elif msg_type == "end_session" and is_admin:
            await self._handle_end_session(session_id)

        elif msg_type == "ping":
            await ws.send_json({"type": "pong"})

    async def _handle_chat(self, ws, session_id, token, data):
        validation = self.replay.validate_message(session_id, token, data)
        if not validation.valid:
            return
        if not self.rate_limiter.check(token, session_id):
            await ws.send_json({"type": "rate_limited"})
            return
        await self._broadcast(session_id, data, exclude=ws)

    async def _handle_announcement(self, session_id, data):
        redis.lpush(f"announcements:{session_id}", json.dumps(data))
        redis.expire(f"announcements:{session_id}",
                     self._session_ttl(session_id))
        await self._broadcast(session_id,
                               {**data, "type": "announcement_banner"})

    async def _handle_gallery(self, session_id, token, data):
        url = data.get("url", "")
        if not url.startswith("https://res.cloudinary.com/"):
            return
        redis.rpush(f"gallery:{session_id}", url)
        redis.expire(f"gallery:{session_id}",
                     self._session_ttl(session_id))
        await self._broadcast(session_id, data)

    async def _handle_end_session(self, session_id):
        await self._broadcast(session_id, {
            "type": "session_ending",
            "grace_seconds": 60
        })
        asyncio.create_task(
            post_event_pipeline(session_id, delay_seconds=60)
        )
```

### Batch Collector (No AI)

```python
# backend/workers/batch_collector.py

from collections import Counter
import re

STOP_WORDS = {"the","a","is","it","in","on","at","to","and","of",
              "i","this","that","was","are","be","have","you","me"}

async def collect_batch(session_id: str):
    window_end   = datetime.utcnow()
    window_start = window_end - timedelta(minutes=30)

    messages = venue_ws_manager.get_window_messages(
        session_id, window_start, window_end
    )
    if not messages:
        return

    texts = [m.get("plaintext","") for m in messages if m.get("plaintext")]
    words = []
    for text in texts:
        words.extend([
            w.lower() for w in re.findall(r'\b[a-z]{3,}\b', text.lower())
            if w not in STOP_WORDS
        ])

    summary = {
        "window":        f"{window_start.strftime('%H:%M')}-"
                         f"{window_end.strftime('%H:%M')}",
        "message_count": len(messages),
        "photo_count":   sum(1 for m in messages
                             if m.get("type") == "gallery"),
        "question_count": sum(1 for t in texts if "?" in t),
        "reaction_count": sum(1 for m in messages
                              if m.get("type") == "reaction"),
        "top_words":     [w for w,_ in Counter(words).most_common(10)]
    }

    redis.rpush(f"batches:{session_id}", json.dumps(summary))
    redis.expire(f"batches:{session_id}", 86400)
```

### Post-Event Pipeline

```python
# backend/workers/post_event_pipeline.py

async def post_event_pipeline(session_id: str, delay_seconds: int = 60):
    await asyncio.sleep(delay_seconds)
    session = SessionService.get(session_id)

    await collect_batch(session_id)

    batches   = redis.lrange(f"batches:{session_id}", 0, -1)
    summaries = [json.loads(b) for b in batches]
    report    = await run_ai_analysis(session, summaries)
    pdf_path  = ReportService.generate_pdf(session.event_name, report)

    gallery_urls = redis.lrange(f"gallery:{session_id}", 0, -1)
    zip_path     = await GalleryService.compile_zip(
        session.event_name, gallery_urls
    )

    await EmailService.send_post_event(
        to=session.organiser_email,
        event_name=session.event_name,
        pdf_path=pdf_path,
        zip_path=zip_path
    )

    await CloudinaryService.delete_session_images(session_id)
    redis.delete(f"batches:{session_id}")
    redis.delete(f"gallery:{session_id}")
    redis.delete(f"announcements:{session_id}")
    SessionService.mark_deleted(session_id)
    VenueWebSocketManager.cleanup_session(session_id)

    await EmailService.send_deletion_confirmation(
        to=session.organiser_email,
        event_name=session.event_name
    )
```

---

## 15. Frontend Implementation

### Three-Tab Layout

```typescript
// frontend/src/pages/venue/VenueSession.tsx

export default function VenueSession() {
  const [activeTab, setActiveTab] =
    useState<'chat'|'gallery'|'announcements'>('chat')
  const [announcementBadge, setAnnouncementBadge] = useState(false)
  const { session, token, isAdmin } = useVenueSession()

  useEffect(() => {
    if (activeTab !== 'announcements') setAnnouncementBadge(true)
  }, [session.latestAnnouncement])

  return (
    <div className="flex flex-col h-screen bg-navy">
      <div className="flex border-b border-white/10">
        {(['chat','gallery','announcements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              if (tab === 'announcements') setAnnouncementBadge(false)
            }}
            className={`flex-1 py-3 text-sm font-medium relative
              ${activeTab === tab
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-white/40'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'announcements' && announcementBadge && (
              <span className="absolute top-2 right-4 w-2 h-2
                               bg-sky-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' &&
          <ChatTab isAdmin={isAdmin} token={token} />}
        {activeTab === 'gallery' &&
          <GalleryTab isAdmin={isAdmin} sessionId={session.id} />}
        {activeTab === 'announcements' &&
          <AnnouncementsTab isAdmin={isAdmin} programme={session.programme} />}
      </div>
    </div>
  )
}
```

### Admin Message Type Selector

```typescript
// frontend/src/components/venue/AdminMessageComposer.tsx

const MESSAGE_TYPES = [
  { id: 'chat',             label: 'Message' },
  { id: 'announcement',     label: 'Announcement' },
  { id: 'programme_update', label: 'Programme Update' },
]

export function AdminMessageComposer({ onSend }) {
  const [type, setType]         = useState('chat')
  const [input, setInput]       = useState('')
  const [showPicker, setPicker] = useState(false)

  return (
    <div className="border-t border-white/10 p-3">
      {showPicker && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {MESSAGE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => { setType(t.id); setPicker(false) }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs
                font-medium ${type === t.id
                  ? 'bg-sky-500 text-white'
                  : 'bg-white/10 text-white/60'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => setPicker(!showPicker)}
          className="text-sky-400 text-xs font-medium px-2 py-1
                     rounded border border-sky-400/30"
        >
          {MESSAGE_TYPES.find(t => t.id === type)?.label}
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={type === 'announcement'
            ? 'Write announcement...' : 'Message...'}
          className="flex-1 bg-white/5 rounded-xl px-4 py-2
                     text-white text-sm"
        />
        <button
          onClick={() => { onSend(type, input); setInput('') }}
          className="bg-sky-500 rounded-xl px-4 py-2
                     text-white text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

### Gallery Tab with IndexedDB

```typescript
// frontend/src/pages/venue/GalleryTab.tsx

import { openDB } from 'idb'

const getDB = (sessionId: string) =>
  openDB('driflly_venue', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('gallery_photos')) {
        db.createObjectStore('gallery_photos', { keyPath: 'key' })
      }
    }
  })

export function GalleryTab({ isAdmin, sessionId }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])

  useEffect(() => {
    const load = async () => {
      const db  = await getDB(sessionId)
      const all = await db.getAll('gallery_photos')
      setPhotos(
        all.filter(p => p.session_id === sessionId)
           .sort((a, b) => a.timestamp - b.timestamp)
      )
    }
    load()
  }, [sessionId])

  useEffect(() => {
    const onGallery = async (msg: GalleryMessage) => {
      const photo = {
        key:        `gallery:${sessionId}:${msg.timestamp}`,
        session_id: sessionId,
        url:        msg.url,
        timestamp:  msg.timestamp,
        featured:   false
      }
      const db = await getDB(sessionId)
      await db.put('gallery_photos', photo)
      setPhotos(prev => [...prev, photo])
    }
    venueSocket.on('gallery', onGallery)
    return () => venueSocket.off('gallery', onGallery)
  }, [sessionId])

  const handleUpload = async (file: File) => {
    const resized   = await resizeImage(file, 1200)
    const formData  = new FormData()
    formData.append('file', resized)
    formData.append('upload_preset',
      import.meta.env.VITE_CLOUDINARY_PRESET)
    const res  = await fetch(
      `https://api.cloudinary.com/v1_1/`+
      `${import.meta.env.VITE_CLOUDINARY_CLOUD}/image/upload`,
      { method: 'POST', body: formData }
    )
    const data = await res.json()
    venueSocket.send({
      type:      'gallery',
      url:       data.secure_url,
      timestamp: Date.now()
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-3 gap-0.5 overflow-y-auto flex-1">
        {photos.map(photo => (
          <GalleryPhotoTile
            key={photo.key}
            photo={photo}
            isAdmin={isAdmin}
          />
        ))}
      </div>
      <div className="p-4 border-t border-white/10">
        <PhotoUploadButton onUpload={handleUpload} />
      </div>
    </div>
  )
}
```

---

## 16. Data Flow Summary

```
PRE-EVENT
  Organiser creates session
    -> session_key generated (memory only, never in DB)
    -> permanent public QR generated
    -> permanent admin QR generated (admin_token in fragment only)
    -> session sits in 'scheduled' state
    -> organiser prints public QR for venue display

EVENT DAY
  Attendee scans public QR
    -> consent screen shown
    -> join endpoint called over HTTPS
    -> session_key returned in response body
    -> anonymous token assigned (session storage only)
    -> WebSocket connection opened
    -> attendee enters Chat tab

  Every message sent
    -> encrypted AES-256-GCM client-side
    -> HMAC + sequence + nonce added
    -> sent to server as ciphertext
    -> server validates replay protection
    -> server decrypts for batch word counting only
    -> server re-relays ciphertext to other clients
    -> recipients decrypt client-side

  Every 30 minutes (zero AI)
    -> batch_collector counts messages, photos, top words
    -> compact summary stored in Redis

  Attendee uploads photo
    -> resized client-side to max 1200px
    -> uploaded direct to Cloudinary (never hits Driflly)
    -> Cloudinary URL sent to server via WebSocket
    -> URL stored in Redis, broadcast to all clients
    -> each client fetches image and stores in IndexedDB

  Admin posts announcement
    -> stored in Redis with session TTL
    -> broadcast to all clients as full-screen banner

SESSION END
  Organiser ends session (or timer expires)
    -> 60-second grace window broadcast to all clients
    -> final batch collected
    -> AI analysis: one API call, ~3,500 tokens, <$0.01
    -> PDF report generated
    -> Gallery zip compiled from Cloudinary URLs
    -> Report PDF + gallery zip emailed to organiser
    -> All Cloudinary images deleted
    -> All Redis keys deleted
    -> Session key deleted from memory
    -> Session marked deleted_at in database
    -> IndexedDB cleared on all connected clients
    -> Deletion confirmation emailed to organiser
```

---

*This document is the complete specification for Driflly Venue Mode version 2.0. Implementation begins with Phase 1 as defined in Section 13.*

*github.com/Yothabo/dispozhe*
