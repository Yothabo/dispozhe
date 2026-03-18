# Driflly: Core Algorithm Specification

**Version:** 2.0
**Date:** March 2026
**Status:** Production

This document specifies the algorithms underlying all security-critical and
operationally significant behaviours of the Driflly system. Pseudocode uses
a consistent notation: `//` for inline comments, `||` for byte-level
concatenation, and function names in PascalCase. Time values are in seconds
unless otherwise stated. All cryptographic comparisons use constant-time
implementations where noted.

---

## Table of Contents

1. [Session Lifecycle](#1-session-lifecycle)
2. [Key Generation and Exchange](#2-key-generation-and-exchange)
3. [Message Encryption and Transmission](#3-message-encryption-and-transmission)
4. [Message Reception and Validation](#4-message-reception-and-validation)
5. [Replay Protection State Management](#5-replay-protection-state-management)
6. [Rate Limiting](#6-rate-limiting)
7. [Code Generation and Validation](#7-code-generation-and-validation)
8. [WebSocket Connection Manager](#8-websocket-connection-manager)
9. [Session Expiry and Cleanup](#9-session-expiry-and-cleanup)
10. [Mobile Keyboard Handling](#10-mobile-keyboard-handling)
11. [Session Timer and Extension](#11-session-timer-and-extension)
12. [Message Queue and Retry](#12-message-queue-and-retry)
13. [End-to-End System Flow](#13-end-to-end-system-flow)
14. [Security Property Summary](#14-security-property-summary)
15. [Changelog](#15-changelog)

---

## Notation and Constants

| Constant | Value | Description |
|---|---|---|
| `MAX_SEQUENCE_GAP` | 100 | Maximum gap between consecutive sequence numbers |
| `NONCE_EXPIRY_SECONDS` | 300 | Nonce cache retention window (5 minutes) |
| `CODE_EXPIRY_SECONDS` | 30 | One-time access code validity window |
| `MAX_PARTICIPANTS` | 2 | Hard limit on WebSocket connections per session |
| `MAX_RECONNECT_ATTEMPTS` | 30 | Client-side reconnection ceiling |
| `HEARTBEAT_INTERVAL` | 25 | Seconds between server ping frames |
| `HEARTBEAT_TIMEOUT` | 30 | Seconds to wait for pong before counting miss |
| `MAX_MISSED_PONGS` | 5 | Consecutive missed pongs before connection close |
| `MAX_QUEUE_SIZE` | 100 | Maximum queued outbound messages per session |
| `RATE_LIMIT_WINDOW` | 60 | Rate limiting observation window in seconds |
| `RATE_LIMIT_MAX` | 5 | Max code redemption attempts per window per IP |
| `MIN_DURATION_MINUTES` | 1 | Minimum permitted session duration |
| `MAX_DURATION_MINUTES` | 1440 | Maximum permitted session duration (24 hours) |
| `RECONNECT_BASE_DELAY` | 1000 | Base reconnection delay in milliseconds |
| `RECONNECT_MULTIPLIER` | 1.5 | Exponential backoff growth factor |
| `RECONNECT_MAX_DELAY` | 30000 | Maximum reconnection delay in milliseconds |

---
## 1. Session Lifecycle

**Purpose:** Create a new ephemeral session, persist metadata, and return
access credentials to the session creator.

**Bug fixed:** `expiry_time = creation_time + 365 days` corrected to
`creation_time + (duration_minutes * 60)`. The 365-day placeholder
prevented the expiry scheduler from ever firing.

**Complexity:** O(1) — single database insert, constant-time code generation.
Algorithm: SessionLifecycle
Input:  duration_minutes  in [MIN_DURATION_MINUTES, MAX_DURATION_MINUTES]
Output: session_id, access_code, shareable_link, success_status
BEGIN
IF duration_minutes < MIN_DURATION_MINUTES
OR duration_minutes > MAX_DURATION_MINUTES THEN
RETURN {status: "error", reason: "invalid_duration"}
END IF
session_id    = GenerateCryptographicID(16)   // 128-bit CSPRNG, hex-encoded
creation_time = GetCurrentUTC()
expiry_time   = creation_time + (duration_minutes * 60)
INSERT INTO sessions (
id, created_at, expires_at, duration_minutes,
participant_count, status, link_active, chat_started_at
) VALUES (
session_id, creation_time, expiry_time, duration_minutes,
1, 'waiting', true, NULL
)
code = GenerateSixDigitCode(session_id, creation_time + CODE_EXPIRY_SECONDS)
link = ConstructShareableLink(session_id)
RETURN {
session_id: session_id,
code:       code,
link:       link,
expires_at: expiry_time,
status:     "created"
}
END
**Notes:**
- `expiry_time` governs when the chat timer elapses. Codes expire after
  30 seconds. Links are single-use. These are independent expiry windows.
- No message content, encryption keys, or participant identifiers appear
  in the database at any stage.

---

## 2. Key Generation and Exchange

**Purpose:** Ensure both session participants hold the same AES-256-GCM key
while minimising server-side key exposure.

**Improvement:** The code join path now shows the explicit HTTP POST
mechanism rather than the opaque RetrieveKeyFromServer call. The mechanism
is security-relevant because it determines when the server observes the key.

**Complexity:** O(1) — local key generation plus one HTTP round-trip.
Algorithm: KeyExchange
Input:  join_method  in {'creator', 'code', 'link'}
session_id   (string)
Output: encryption_key (CryptoKey), key_id (string), success_status
BEGIN
IF join_method == 'creator' THEN
encryption_key = crypto.subtle.generateKey(
algorithm   = {name: "AES-GCM", length: 256},
extractable = true,
key_usages  = ["encrypt", "decrypt"]
)
key_export = crypto.subtle.exportKey("raw", encryption_key)
key_id     = Base64Encode(key_export)[0:8]
StoreKeyInMemory(key_id, encryption_key)
RETURN {key: encryption_key, key_id: key_id, status: "generated"}
ELSE IF join_method == 'code' THEN
// Server returns key in the code redemption HTTP response.
// Server observes key in transit over TLS but holds no long-term record.
response       = HTTP_POST("/session/code/{code}")
raw_key_bytes  = Base64Decode(response.encryption_key)
encryption_key = crypto.subtle.importKey(
format      = "raw",
key_data    = raw_key_bytes,
algorithm   = {name: "AES-GCM"},
extractable = false,
key_usages  = ["encrypt", "decrypt"]
)
key_id = Base64Encode(raw_key_bytes)[0:8]
StoreKeyInMemory(key_id, encryption_key)
RETURN {key: encryption_key, key_id: key_id, status: "imported"}
ELSE IF join_method == 'link' THEN
// Key is in the URL fragment. Fragments are never transmitted
// in HTTP requests. The server never sees the key on this path.
fragment_params = ParseURLFragment(window.location.hash)
raw_key_bytes   = Base64Decode(fragment_params.key)
encryption_key  = crypto.subtle.importKey(
format      = "raw",
key_data    = raw_key_bytes,
algorithm   = {name: "AES-GCM"},
extractable = false,
key_usages  = ["encrypt", "decrypt"]
)
key_id = Base64Encode(raw_key_bytes)[0:8]
StoreKeyInMemory(key_id, encryption_key)
ClearURLFragment()
RETURN {key: encryption_key, key_id: key_id, status: "extracted"}
ELSE
RETURN {status: "error", reason: "unknown_join_method"}
END IF
END
**Security properties by join method:**

| Method | Server observes key? | Key in browser history? |
|---|---|---|
| creator | No | No |
| code | Yes (in transit only, over TLS) | No |
| link | No | No (after ClearURLFragment) |

---
## 3. Message Encryption and Transmission

**Purpose:** Encrypt plaintext, attach replay protection fields, and deliver
the secure envelope via WebSocket.

**Complexity:** O(n) where n is message length — dominated by AES-GCM.
Algorithm: EncryptAndSendMessage
Input:  plaintext_message   (string)
session_key         (CryptoKey, AES-256-GCM)
sequence_counter    (integer, monotonically increasing per sender)
key_id              (string)
Output: {status, message_id}
BEGIN
iv         = crypto.getRandomValues(Uint8Array(12))
message_id = GenerateUUID4()
timestamp  = GetCurrentUnixMilliseconds()
nonce      = Base64Encode(crypto.getRandomValues(Uint8Array(16)))
// AES-256-GCM authenticated encryption.
// Output includes 128-bit auth tag appended to ciphertext.
ciphertext = crypto.subtle.encrypt(
algorithm = {name: "AES-GCM", iv: iv, tagLength: 128},
key       = session_key,
data      = TextEncoder.encode(plaintext_message)
)
encrypted_payload = iv || ciphertext        // 12 + |ciphertext| bytes
encoded_payload   = Base64Encode(encrypted_payload)
hmac_input = encoded_payload + ":" + sequence_counter + ":" + nonce
hmac       = HMAC_SHA256(key = session_key, data = hmac_input)
secure_message = {
type:      "message",
id:        message_id,
data:      encoded_payload,
keyId:     key_id,
sequence:  sequence_counter,
nonce:     nonce,
hmac:      hmac,
timestamp: timestamp
}
send_status = WebSocketSend(JSON.stringify(secure_message))
IF send_status == success THEN
IncrementSequenceCounter()
RETURN {status: "sent", message_id: message_id}
ELSE
QueueMessageForRetry(secure_message)
RETURN {status: "queued", message_id: message_id}
END IF
END
**Notes:**
- The GCM `iv` and the replay-protection `nonce` are distinct fields
  serving distinct purposes. The IV prevents GCM nonce reuse; the nonce
  enables server-side replay detection without the server holding the key.
- The sequence counter increments AFTER confirmed send to prevent gaps
  from failed transmissions.

---

## 4. Message Reception and Validation

**Purpose:** Validate all security fields of an incoming envelope before
decryption, then deliver plaintext to the UI.

**Bug fixed:** Sequence and nonce state are no longer committed inside the
validation functions. State is committed only after ALL checks pass
including HMAC, preventing a TOCTOU attack that could poison sequence
state with a forged envelope.

**Complexity:** O(n) — validation gates are O(1); decryption is O(n).
Algorithm: ReceiveAndValidateMessage
Input:  raw_websocket_message  (string, JSON)
session_key            (CryptoKey)
expected_key_id        (string)
session_id             (string)
Output: {status, message?}
BEGIN
message = ParseJSON(raw_websocket_message)
// Schema validation — cheapest check runs first
required_fields = ['id','data','keyId','sequence','nonce','hmac','timestamp']
IF NOT message.HasAll(required_fields) THEN
LogSecurityEvent("missing_fields", session_id)
RETURN {status: "rejected", reason: "missing_fields"}
END IF
IF message.keyId != expected_key_id THEN
LogSecurityEvent("key_id_mismatch", session_id)
RETURN {status: "rejected", reason: "key_id_mismatch"}
END IF
// Replay check 1: sequence monotonicity (read-only, no state commit)
seq_result = ValidateSequence(session_id, message.client_id, message.sequence)
IF NOT seq_result.valid THEN
LogSecurityEvent("sequence_rejected", session_id, seq_result.reason)
RETURN {status: "rejected", reason: seq_result.reason}
END IF
// Replay check 2: nonce uniqueness (read-only, no state commit)
nonce_result = ValidateNonce(session_id, message.nonce)
IF NOT nonce_result.valid THEN
LogSecurityEvent("nonce_replayed", session_id)
RETURN {status: "rejected", reason: "nonce_replayed"}
END IF
// Integrity check — MUST use constant-time comparison
expected_hmac = HMAC_SHA256(
key  = session_key,
data = message.data + ":" + message.sequence + ":" + message.nonce
)
IF NOT ConstantTimeEqual(message.hmac, expected_hmac) THEN
LogSecurityEvent("hmac_invalid", session_id)
RETURN {status: "rejected", reason: "hmac_invalid"}
END IF
// All checks passed — NOW commit replay protection state
UpdateLastSequence(session_id, message.client_id, message.sequence)
StoreNonce(session_id, message.nonce, GetCurrentTime())
encrypted_bytes = Base64Decode(message.data)
iv              = encrypted_bytes[0:12]
ciphertext      = encrypted_bytes[12:]
// GCM decryption verifies the auth tag internally; throws on tampering
plaintext = crypto.subtle.decrypt(
algorithm = {name: "AES-GCM", iv: iv, tagLength: 128},
key       = session_key,
data      = ciphertext
)
SendReadReceipt(message.id)
RETURN {status: "delivered", message: TextDecoder.decode(plaintext)}
END
**Notes:**
- Validation gates execute in the order shown. Schema and sequence checks
  precede HMAC to avoid unnecessary cryptographic work on malformed input.
- ConstantTimeEqual is mandatory. Variable-time comparison leaks byte-match
  information enabling a forgery oracle.
- AES-GCM auth tag provides a second independent integrity check on the
  raw ciphertext.

---
## 5. Replay Protection State Management

**Purpose:** Maintain server-side state enabling detection of replayed or
forged message envelopes.

**Bug fixed:** ValidateSequence and ValidateNonce are now read-only.
State commit is handled by UpdateLastSequence and StoreNonce, called by
ReceiveAndValidateMessage only after HMAC verification passes.

**Data structures:**
sequences[session_id][client_id]  ->  last_seen_sequence  (integer)
seen_nonces[session_id][nonce]    ->  arrival_timestamp   (unix seconds)
**Complexity:**
- ValidateSequence: O(1)
- ValidateNonce: O(k) per call for expiry cleanup; amortised O(1)
Algorithm: ReplayProtection
FUNCTION ValidateSequence(session_id, client_id, sequence):
// Read-only. Does not commit state.
IF session_id NOT IN sequences THEN
sequences[session_id] = {}
END IF
IF client_id NOT IN sequences[session_id] THEN
RETURN {valid: true, first_message: true}
END IF
last_seq = sequences[session_id][client_id]
IF sequence <= last_seq THEN
RETURN {valid: false, reason: "sequence_too_old"}
END IF
IF sequence > last_seq + MAX_SEQUENCE_GAP THEN
RETURN {valid: false, reason: "sequence_gap_too_large"}
END IF
RETURN {valid: true, first_message: false}
END FUNCTION
FUNCTION UpdateLastSequence(session_id, client_id, sequence):
// Called by ReceiveAndValidateMessage after all checks pass.
sequences[session_id][client_id] = sequence
END FUNCTION
FUNCTION ValidateNonce(session_id, nonce):
// Read-only. Does not commit state.
current_time = GetCurrentUnixSeconds()
IF session_id NOT IN seen_nonces THEN
seen_nonces[session_id] = {}
END IF
FOR EACH (n, arrival) IN seen_nonces[session_id]:
IF current_time - arrival > NONCE_EXPIRY_SECONDS THEN
DELETE seen_nonces[session_id][n]
END IF
END FOR
IF nonce IN seen_nonces[session_id] THEN
RETURN {valid: false, reason: "nonce_replayed"}
END IF
RETURN {valid: true}
END FUNCTION
FUNCTION StoreNonce(session_id, nonce, arrival_time):
// Called by ReceiveAndValidateMessage after all checks pass.
seen_nonces[session_id][nonce] = arrival_time
END FUNCTION
FUNCTION CleanupSessionReplayState(session_id):
DELETE sequences[session_id]
DELETE seen_nonces[session_id]
END FUNCTION
**Memory bound per session:**
- Sequence state: O(P) where P <= MAX_PARTICIPANTS = 2 entries maximum.
- Nonce state: O(R x NONCE_EXPIRY_SECONDS) where R is messages per second.
  At 40 msg/s the cache holds at most 12,000 entries.

---

## 6. Rate Limiting

**Purpose:** Prevent brute-force enumeration of six-digit access codes by
bounding the redemption attempt rate per source IP address.

**Note:** Missing from the original draft. The security model referenced
rate limiting but provided no algorithm. Added here.

**Complexity:** O(1) — hash map lookup and counter increment.
Algorithm: RateLimiter
Data Structures:
attempt_log[ip_address]  ->  {count, window_start}  (in memory)
FUNCTION CheckRateLimit(ip_address):
current_time = GetCurrentUnixSeconds()
IF ip_address NOT IN attempt_log THEN
attempt_log[ip_address] = {count: 0, window_start: current_time}
END IF
entry = attempt_log[ip_address]
IF current_time - entry.window_start >= RATE_LIMIT_WINDOW THEN
entry.count        = 0
entry.window_start = current_time
END IF
IF entry.count >= RATE_LIMIT_MAX THEN
retry_after = RATE_LIMIT_WINDOW - (current_time - entry.window_start)
RETURN {
allowed:     false,
reason:      "rate_limit_exceeded",
retry_after: retry_after
}
END IF
entry.count++
RETURN {allowed: true, attempts_remaining: RATE_LIMIT_MAX - entry.count}
END FUNCTION
**Notes:**
- Applies to /session/code/{code} only. Session creation and status
  polling are not application-layer rate-limited.
- The fixed-window algorithm admits a burst at window boundaries. A
  sliding-window implementation provides smoother enforcement at the cost
  of additional memory per IP.

---
## 7. Code Generation and Validation

**Purpose:** Produce a six-digit numeric code providing single-use,
time-limited access to a session.

**Bug fixed:** ValidateCode now marks the code as redeemed BEFORE
returning success. The original sequence allowed two simultaneous requests
to both read redeemed=false and both succeed (TOCTOU race condition).

**Complexity:**
- GenerateSixDigitCode: O(k) for collision offset iterations; O(1) typical.
- ValidateCode: O(1)
Algorithm: CodeManager
Data Structures:
active_codes[code_string]  ->  {session_id, expires_at, redeemed}
FUNCTION GenerateSixDigitCode(session_id, expires_at):
hash      = SHA256(UTF8Encode(session_id))
hash_int  = IntFromBigEndianBytes(hash[0:8])
base_code = hash_int MOD 1_000_000
offset      = 0
code_int    = base_code
code_string = FormatSixDigits(code_int)
WHILE code_string IN active_codes
AND active_codes[code_string].redeemed == false:
offset++
code_int    = (base_code + offset) MOD 1_000_000
code_string = FormatSixDigits(code_int)
END WHILE
active_codes[code_string] = {
session_id: session_id,
expires_at: expires_at,
redeemed:   false
}
RETURN code_string
END FUNCTION
FUNCTION ValidateCode(code_string, ip_address):
rate_check = CheckRateLimit(ip_address)
IF NOT rate_check.allowed THEN
RETURN {valid: false, reason: "rate_limit_exceeded",
retry_after: rate_check.retry_after}
END IF
IF code_string NOT IN active_codes THEN
RETURN {valid: false, reason: "not_found"}
END IF
entry = active_codes[code_string]
IF GetCurrentUnixSeconds() > entry.expires_at THEN
DELETE active_codes[code_string]
RETURN {valid: false, reason: "expired"}
END IF
IF entry.redeemed == true THEN
RETURN {valid: false, reason: "already_used"}
END IF
// Mark redeemed BEFORE returning to prevent TOCTOU race
entry.redeemed = true
RETURN {valid: true, session_id: entry.session_id}
END FUNCTION
FUNCTION InvalidateSessionCodes(session_id):
FOR EACH (code, entry) IN active_codes:
IF entry.session_id == session_id THEN
DELETE active_codes[code]
END IF
END FOR
END FUNCTION
---

## 8. WebSocket Connection Manager

**Purpose:** Manage the pool of active connections per session, enforce
participant limits, route validated messages, and detect stale connections
via heartbeat.

**Bug fixed:** missed_pongs now explicitly initialised to 0 before the
heartbeat loop. MAX_RECONNECT_ATTEMPTS correctly moved to the client-side
reconnection function where it belongs — it is not a server-side constant.

**Complexity:**
- HandleNewConnection: O(1)
- RouteMessage: O(P) where P <= MAX_PARTICIPANTS
Algorithm: WebSocketConnectionManager
Data Structures:
connections[session_id]  ->  Set[WebSocket]
session_map[websocket]   ->  session_id
FUNCTION HandleNewConnection(websocket, session_id):
IF CountConnections(session_id) >= MAX_PARTICIPANTS THEN
websocket.close(4003, "Maximum connections reached")
RETURN {status: "rejected", reason: "session_full"}
END IF
connections[session_id].add(websocket)
session_map[websocket] = session_id
IF CountConnections(session_id) == MAX_PARTICIPANTS THEN
BroadcastToSession(session_id, {type: "participant_joined"})
MarkChatStarted(session_id)
END IF
StartHeartbeat(websocket)
DeliverQueuedMessages(session_id, websocket)
RETURN {status: "accepted"}
END FUNCTION
FUNCTION RouteMessage(session_id, message, sender):
recipients = connections[session_id] - {sender}
FOR EACH recipient IN recipients:
send_result = recipient.send(JSON.stringify(message))
IF NOT send_result.ok THEN
QueueMessage(session_id, message)
END IF
END FOR
END FUNCTION
FUNCTION HandleDisconnection(websocket):
session_id = session_map[websocket]
connections[session_id].remove(websocket)
DELETE session_map[websocket]
remaining = CountConnections(session_id)
IF remaining == 1 THEN
BroadcastToSession(session_id, {type: "participant_disconnected"})
ScheduleReconnectTimeout(session_id, 15)
ELSE IF remaining == 0 THEN
CleanupSession(session_id)
END IF
END FUNCTION
FUNCTION ScheduleReconnectTimeout(session_id, timeout_seconds):
Sleep(timeout_seconds)
IF CountConnections(session_id) == 1 THEN
BroadcastToSession(session_id, {type: "participant_left_permanently"})
END IF
END FUNCTION
FUNCTION StartHeartbeat(websocket):
missed_pongs = 0  // Explicitly initialised
WHILE websocket.is_open:
Sleep(HEARTBEAT_INTERVAL)
websocket.send(JSON.stringify({
type:      "ping",
timestamp: GetCurrentUnixMilliseconds()
}))
pong_received = WaitForPong(websocket, HEARTBEAT_TIMEOUT)

IF pong_received THEN
  missed_pongs = 0
ELSE
  missed_pongs++
  IF missed_pongs >= MAX_MISSED_PONGS THEN
    websocket.close(1001, "Heartbeat timeout")
    HandleDisconnection(websocket)
    BREAK
  END IF
END IF
END WHILE
END FUNCTION
// Client-side only — runs in the browser, not on the server
FUNCTION AttemptReconnect(session_id, attempt_number):
IF attempt_number > MAX_RECONNECT_ATTEMPTS THEN
EmitPermanentFailure()
RETURN
END IF
delay = MIN(
RECONNECT_BASE_DELAY * (RECONNECT_MULTIPLIER ^ attempt_number),
RECONNECT_MAX_DELAY
)
Sleep(delay)
result = WebSocketConnect(session_id)
IF result.ok THEN
reconnect_attempts = 0
ELSE
AttemptReconnect(session_id, attempt_number + 1)
END IF
END FUNCTION
---
## 9. Session Expiry and Cleanup

**Purpose:** Automatically terminate sessions whose duration has elapsed
and reclaim all associated in-memory and database resources.

**Schedule:** Background task, runs every 60 seconds.

**Complexity:** O(E x P) where E is expired sessions and P <= MAX_PARTICIPANTS.
Algorithm: SessionExpiryManager
FUNCTION RunExpiryPass():
current_time = GetCurrentUTC()
expired_sessions = SELECT id FROM sessions
WHERE expires_at <= current_time
AND status IN ('active', 'waiting')
FOR EACH session_id IN expired_sessions:
TerminateSession(session_id, reason = "timer_expired")
END FOR
END FUNCTION
FUNCTION TerminateSession(session_id, reason):
FOR EACH websocket IN connections[session_id]:
websocket.send(JSON.stringify({
type:   "session_terminated",
reason: reason
}))
websocket.close(1000, "Session ended")
END FOR
DELETE FROM sessions WHERE id = session_id
DELETE connections[session_id]
CleanupSessionReplayState(session_id)
InvalidateSessionCodes(session_id)
END FUNCTION
---

## 10. Mobile Keyboard Handling

**Purpose:** Reposition the chat input bar when the virtual keyboard appears
or dismisses, keeping the message history and header visually stationary.

**Bug fixed:** The original used paddingBottom on the message container,
which causes layout reflow and viewport shifts. The correct approach uses
position:fixed on the input bar with bottom:keyboardHeight so only the
input bar moves. The message container is unaffected.

**Complexity:** O(1) per viewport resize event.
Algorithm: MobileKeyboardHandler
State:
keyboard_height   (integer, pixels, default 0)
is_keyboard_open  (boolean, default false)
is_at_bottom      (boolean, default true)
FUNCTION Initialise():
IF window.visualViewport EXISTS THEN
window.visualViewport.addEventListener('resize', OnViewportResize)
END IF
messages_container.addEventListener('scroll', OnScroll)
END FUNCTION
FUNCTION OnViewportResize():
current_viewport_height = window.visualViewport.height
window_height           = window.innerHeight
gap                     = window_height - current_viewport_height
// 100px threshold distinguishes keyboard events from browser chrome
// changes (address bar collapse) which must not trigger repositioning
IF gap > 100 THEN
keyboard_height  = gap
is_keyboard_open = true
// Move ONLY the input bar — message container stays stationary
input_bar.style.position = "fixed"
input_bar.style.bottom   = keyboard_height + "px"

IF is_at_bottom THEN
  ScrollToBottom(behavior = 'auto')
  // 'auto' not 'smooth': smooth scroll conflicts with iOS keyboard
  // animation, producing a visible double-animation effect
END IF
ELSE
keyboard_height  = 0
is_keyboard_open = false
input_bar.style.bottom = "0px"
END IF
END FUNCTION
FUNCTION OnScroll():
scroll_top    = messages_container.scrollTop
scroll_height = messages_container.scrollHeight
client_height = messages_container.clientHeight
distance_from_bottom = scroll_height - scroll_top - client_height
is_at_bottom         = distance_from_bottom < 100
END FUNCTION
FUNCTION ScrollToBottom(behavior):
messages_container.scrollTo({
top:      messages_container.scrollHeight,
behavior: behavior
})
END FUNCTION
---
## 11. Session Timer and Extension

**Purpose:** Maintain a countdown display synchronised with the server's
authoritative expiry timestamp, with colour-coded urgency cues and
extension broadcasting.

**Bug fixed:** The original decremented time_left-- on each tick.
JavaScript setInterval is imprecise — this accumulates drift over long
sessions. The corrected version derives time_left from
expiration_time - GetCurrentUnixSeconds() on each tick, staying accurate
regardless of interval imprecision.

**Complexity:** O(1) per tick.
Algorithm: SessionTimer
State:
time_left       (integer, seconds)
expiration_time (unix timestamp)
timer_interval  (handle)
FUNCTION InitialiseTimer(duration_seconds, server_expires_at):
expiration_time = server_expires_at
time_left       = duration_seconds
timer_interval  = SetInterval(1000ms, OnTick)
END FUNCTION
FUNCTION OnTick():
// Derive from server's authoritative timestamp to prevent drift
time_left = expiration_time - GetCurrentUnixSeconds()
IF time_left <= 0 THEN
time_left = 0
ClearInterval(timer_interval)
OnTimerExpired()
RETURN
END IF
IF time_left < 10 THEN
SetTimerDisplay(time_left, colour = "red",    urgency = "critical")
ELSE IF time_left < 30 THEN
SetTimerDisplay(time_left, colour = "yellow", urgency = "warning")
ELSE
SetTimerDisplay(time_left, colour = "sky",    urgency = "normal")
END IF
END FUNCTION
FUNCTION OnTimerExpired():
ShowSessionExpiredModal()
DisconnectWebSocket(code = 1000, reason = "timer_expired")
END FUNCTION
FUNCTION ExtendSession(additional_minutes):
additional_seconds = additional_minutes * 60
expiration_time   += additional_seconds
time_left         += additional_seconds
WebSocketSend(JSON.stringify({
type:       "time_update",
time_left:  time_left,
expires_at: expiration_time
}))
HTTP_PATCH("/session/{session_id}", {
expires_at: UnixToISO8601(expiration_time)
})
END FUNCTION
FUNCTION OnTimeUpdateReceived(message):
expiration_time = message.expires_at
time_left       = message.time_left
// Next OnTick() re-derives from updated expiration_time automatically
END FUNCTION
---

## 12. Message Queue and Retry

**Purpose:** Buffer outbound messages during WebSocket unavailability and
deliver them upon reconnection.

**Complexity:**
- QueueMessage: O(1)
- DeliverQueuedMessages: O(Q) where Q <= MAX_QUEUE_SIZE
Algorithm: MessageQueue
Data Structures:
message_queue[session_id]  ->  Deque[SecureMessage]
FUNCTION QueueMessage(session_id, message):
IF session_id NOT IN message_queue THEN
message_queue[session_id] = new Deque()
END IF
IF message_queue[session_id].size() >= MAX_QUEUE_SIZE THEN
dropped = message_queue[session_id].popLeft()
LogEvent("message_dropped_queue_full", session_id, dropped.id)
END IF
message_queue[session_id].pushRight(message)
END FUNCTION
FUNCTION DeliverQueuedMessages(session_id, websocket):
IF session_id NOT IN message_queue
OR message_queue[session_id].isEmpty() THEN
RETURN
END IF
WHILE NOT message_queue[session_id].isEmpty():
message     = message_queue[session_id].peekLeft()
send_result = websocket.send(JSON.stringify(message))
IF send_result.ok THEN
  message_queue[session_id].popLeft()
ELSE
  LogEvent("queue_delivery_interrupted", session_id)
  BREAK
END IF
END WHILE
END FUNCTION
---
## 13. End-to-End System Flow

**Purpose:** Illustrate the complete interleaved execution of all algorithms
from session creation through termination.
Algorithm: DrifllyFullSystem
Actors: CREATOR, JOINER, SERVER
=====================================================================
PHASE 1: Session Establishment
CREATOR:
session = HTTP_POST /session/create {duration: 5}       [Alg. 1]
-> {session_id, code, link, expires_at}
encryption_key, key_id = KeyExchange('creator', null)   [Alg. 2]
DisplayCodeAndLink(session.code, session.link)
BEGIN polling every 2 seconds:
status = HTTP_GET /session/{session_id}/status
IF status.participant_count == 2 THEN EXIT
END
=====================================================================
PHASE 2: Joiner Access
JOINER:
5.  code = UserEntersCode()
rate_check = CheckRateLimit(joiner_ip)                  [Alg. 6]
IF NOT rate_check.allowed THEN
DisplayRetryError(rate_check.retry_after); RETURN
END IF
result = ValidateCode(code, joiner_ip)                  [Alg. 7]
IF NOT result.valid THEN
DisplayError(result.reason); RETURN
END IF
SERVER:
8.  UPDATE sessions SET participant_count = 2
WHERE id = result.session_id
RETURN {session_id, encryption_key: key_export}
JOINER:
10. encryption_key, key_id = KeyExchange('code', session_id) [Alg. 2]
=====================================================================
PHASE 3: Active Session (both participants, concurrently)
BOTH:
11. WebSocket.connect(wss://{host}/ws/{session_id})
SERVER (on each connection):
12. HandleNewConnection(websocket, session_id)              [Alg. 8]
IF count == 2 THEN
BroadcastBothConnected; MarkChatStarted
END IF
BOTH:
13. InitialiseTimer(duration * 60, session.expires_at)      [Alg. 11]
14. Initialise keyboard handler                             [Alg. 10]
WHILE session_active:
ON user_types_message:
  15. EncryptAndSendMessage(text, key, seq_counter)       [Alg. 3]

ON websocket_message_received:
  16. IF message.type == "ping":
        SendPong(); CONTINUE
  17. IF message.type IN system_types:
        HandleSystemMessage(message); CONTINUE
  18. result = ReceiveAndValidateMessage(message, key)    [Alg. 4]
      IF result.status == "delivered":
        DisplayMessage(result.message)
      ELSE:
        LogRejection(result.reason)

ON time_update_received:
  19. OnTimeUpdateReceived(message)                       [Alg. 11]

ON extend_timer_request:
  20. ExtendSession(additional_minutes)                   [Alg. 11]

ON manual_termination_confirmed:
  21. HTTP_DELETE /session/{session_id}
  22. TerminateSession(session_id, "user_initiated")      [Alg. 9]
  23. BREAK

ON timer_tick -> time_left == 0:
  24. TerminateSession(session_id, "timer_expired")       [Alg. 9]
  25. BREAK

ON websocket_disconnect:
  26. HandleDisconnection(websocket)                      [Alg. 8]
      // Client: exponential backoff reconnection begins  [Alg. 8]
      // Server: 15s grace period before notifying partner
END WHILE
=====================================================================
PHASE 4: Termination
SERVER:
27. FOR EACH websocket IN connections[session_id]:
websocket.send({type: "session_terminated"})
websocket.close(1000)
DELETE FROM sessions WHERE id = session_id
CleanupSessionReplayState(session_id)                   [Alg. 5]
InvalidateSessionCodes(session_id)                      [Alg. 7]
BOTH:
31. PlayDestructionAnimation()
32. RedirectTo("/session-ended")
---
## 14. Security Property Summary

| Property | Mechanism | Algorithm(s) |
|---|---|---|
| Message confidentiality | AES-256-GCM client-side encryption | 3, 4 |
| Message integrity | GCM auth tag + HMAC-SHA256 | 3, 4 |
| Replay prevention — sequence | Monotonic sequence numbers per client | 4, 5 |
| Replay prevention — nonce | 128-bit nonce cache, 5-minute expiry | 4, 5 |
| Replay prevention — forgery | HMAC-SHA256 constant-time verification | 4, 5 |
| TOCTOU prevention | State committed after all checks pass | 4, 5, 7 |
| Zero server-side message storage | In-memory relay only, no DB writes | 1, 8 |
| Zero server key access (link) | Key in URL fragment, never transmitted | 2 |
| Brute-force resistance | Rate limiting + 30-second code expiry | 6, 7 |
| Session isolation | Per-session key material and state structures | 1-5 |
| Stale connection detection | Heartbeat with initialised missed-pong counter | 8 |
| Timer drift prevention | Server-authoritative timestamp derivation | 11 |
| Automatic data deletion | Expiry scheduler + termination cleanup | 9 |
| Input bar keyboard handling | Fixed positioning, not padding reflow | 10 |

---
## 15. Changelog

### Version 2.0 — March 2026

**Bugs corrected from version 1.0:**

**Algorithm 1:** `expiry_time = creation_time + 365 days` corrected to
`creation_time + (duration_minutes * 60)`. The 365-day placeholder
prevented the session expiry scheduler from ever firing on normal sessions.

**Algorithm 2:** `RetrieveKeyFromServer(session_id)` replaced with the
explicit HTTP POST mechanism. The mechanism is security-relevant because
it determines exactly when and how the server observes the session key.

**Algorithms 4 and 5:** Sequence and nonce state commits moved out of
ValidateSequence and ValidateNonce and into ReceiveAndValidateMessage,
executed only after HMAC verification passes. Eliminates a TOCTOU
vulnerability where a forged message could poison sequence state before
the HMAC check had a chance to reject it.

**Algorithm 7:** `entry.redeemed = true` now executes before the success
RETURN, not after. Eliminates a TOCTOU race where two simultaneous code
redemption requests could both read redeemed=false and both receive a
valid session_id response.

**Algorithm 8:** `missed_pongs = 0` explicitly initialised before the
heartbeat loop. `MAX_RECONNECT_ATTEMPTS` correctly moved to the
client-side AttemptReconnect function — it is not a server-side constant
and had no effect where it was previously placed.

**Algorithm 10:** paddingBottom approach replaced with position:fixed and
bottom:keyboardHeight on the input bar. Applying padding to the message
container causes layout reflow and unintended viewport shifts. Fixed
positioning moves only the input bar, leaving the message history and
header completely stationary.

**Algorithm 11:** `time_left--` decrement replaced with
`expiration_time - GetCurrentUnixSeconds()` derivation on each tick.
JavaScript setInterval is not precise — the decrement approach accumulates
meaningful drift on sessions longer than a few minutes.

**Additions in version 2.0:**

**Algorithm 6 (Rate Limiting):** New algorithm specifying the fixed-window
rate limiter on code redemption. Referenced throughout the security model
but absent from the v1.0 algorithm specification.

**Client-side reconnection backoff:** Added to Algorithm 8 showing the
exponential backoff formula and correct placement of MAX_RECONNECT_ATTEMPTS.

**Algorithm 14 (Security Property Summary):** New table mapping every
security property to its implementing algorithm(s).

**Changelog:** This section.

---

*Version 2.0 — March 2026*
*All security-critical comparisons use constant-time implementations.*
*Source: github.com/Yothabo/dispozhe — MIT Licence.*
