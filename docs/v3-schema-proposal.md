# RRSB v3 Schema Proposal — capture *everything*

Goal: record absolutely everything the scoreboard UI produces, across every mode,
down to each ball, free ball, foul, undo, re-rack, correction, and every remote-control
meta action — as a full **play-by-play** per match, plus derived structured tables and
player-level aggregates for future digging.

This is **additive**: nothing about the existing `Match` / `FrameAction` /
`PracticeSession` models or the existing API endpoints changes. All new models are
prefixed `V3` and mapped to `v3_*` tables. New endpoints live under `/api/v3/*`.
We **reuse** the shared `Location` model (no duplication).

---

## Design: three layers

1. **Canonical entities** — `V3Player`, `V3Match`, `V3MatchPlayer`, `V3Frame`,
   `V3Break`, `V3Ball`. Clean, queryable, normalized.
2. **The firehose** — `V3Event`: one append-only row for *every* action that happens
   in a match (pot, foul, miss, manual break, handicap, correct-reds, frame end,
   match end, re-rack, respotted black, undo, redo, edit-last-break, switch player),
   tagged with whether it came from the **display** or a **player's phone** (remote).
   Nothing is ever deleted — undo just flips `wasUndone`.
3. **Remote meta** — `V3RemoteSession` + `V3RemoteEvent`: the QR/remote lifecycle
   (session minted, QR regenerated, phone connected/disconnected, command received).
4. **Aggregates** — `V3Player` lifetime counters + `V3PlayerMatchTypeStat` per match
   type. Anything not pre-aggregated is reconstructable from `V3Event`.

Layers 1 and 2 are written together by the API from the same event stream, so they
never disagree. We store both because the firehose is for arbitrary future analysis
and the structured tables are for fast, obvious queries.

---

## What maps to what (per mode)

| Mode | Captured by |
|---|---|
| **Normal match (break-entry)** | `V3Match` (inputMode=BREAK) → `V3Frame` → one `V3Break` per entered break (with optional missType/ball/pocket detail), every add as a `V3Event` |
| **Ball-by-ball** | `V3Match` (inputMode=BALL_BY_BALL) → `V3Frame` → `V3Break` (a visit) → `V3Ball` per pot (ballType incl. `FREE_BALL`, phase, redsRemaining). Every pot/foul/miss/correction is also a `V3Event` |
| **6-Reds / Liga / QT / Wochenturnier / etc.** | Same as above; `matchType` raw label + normalized `matchTypeCode`; `redsCount` per match & frame |
| **Free ball** | `V3Ball.isFreeBall=true`, `ballType=FREE_BALL`, `points` = value it counted as; on fouls, `V3Event.freeBallGranted` |
| **Re-rack / respotted black** | `V3Event` (RERACK / RESPOTTED_BLACK), `V3Frame.rerackCount`, `V3Frame.respottedBlack` |
| **Corrected reds** | `V3Event` (CORRECT_REDS) with `oldReds`/`newReds` |
| **Undo / redo / edit-last-break** | `V3Event` (UNDO/REDO/EDIT_LAST_BREAK); undone events keep `wasUndone=true` |
| **Handicaps** | `V3MatchPlayer.startingHandicap` + `V3Event` (HANDICAP) |
| **Solo / practice** | `V3PracticeSession` + `V3PracticeAttempt` (break & hit/miss, seriesMode, clearance, missType, ball, pocket) |
| **Remote control** | `V3RemoteSession` + `V3RemoteEvent`; remote-originated scoring also lands in `V3Event` with `source=REMOTE_PHONE` + `remotePlayerIndex` |

---

## Proposed Prisma models

```prisma
// ===================== v3 ENUMS =====================

enum V3MatchType {
  SIX_REDS
  LIGA_A
  LIGA_BC
  OPEN_TURNIER
  QT
  SONSTIGES_TURNIER
  SWISS_SNOOKER_CUP
  TRAININGS_SPIEL
  WOCHENTURNIER
  OTHER
}

enum V3InputMode {
  BREAK
  BALL_BY_BALL
}

enum V3MatchStatus {
  ACTIVE
  FINISHED
  ABORTED
}

enum V3FrameStatus {
  IN_PROGRESS
  COMPLETED
}

enum V3BallType {
  RED
  YELLOW
  GREEN
  BROWN
  BLUE
  PINK
  BLACK
  FREE_BALL
}

enum V3BallColor {
  RED
  YELLOW
  GREEN
  BROWN
  BLUE
  PINK
  BLACK
}

enum V3BBPhase {
  RED
  COLOR
  COLORS_ONLY
}

enum V3MissType {
  LONG
  EASY
  DIFFICULT
  POSITION
  FOUL
}

enum V3Pocket {
  CORNER
  MIDDLE
}

enum V3BreakEndReason {
  MISS
  FOUL
  FRAME_END
  EDIT
  RESPOTTED_BLACK
}

enum V3EventType {
  POT             // a single ball potted (ball-by-ball)
  MANUAL_BREAK    // a whole break entered via calculator (break-entry mode)
  FOUL
  MISS
  HANDICAP
  CORRECT_REDS
  SWITCH_PLAYER
  RERACK
  RESPOTTED_BLACK
  FRAME_END
  MATCH_END
  UNDO
  REDO
  EDIT_LAST_BREAK
}

enum V3EventSource {
  DISPLAY
  REMOTE_PHONE
}

enum V3PracticeMode {
  BREAK
  HITMISS
}

enum V3PracticeAttemptKind {
  BREAK
  CLEARED
  MISSED
  HIT
  MISS
}

enum V3RemoteEventType {
  SESSION_CREATED
  SESSION_ROTATED
  PHONE_CONNECTED
  PHONE_DISCONNECTED
  COMMAND_RECEIVED
}

// ===================== v3 CANONICAL =====================

model V3Player {
  id             String   @id @default(cuid())
  name           String   @unique
  nationalityIOC String?
  club           String?

  // lifetime aggregates (maintained by the API on every match/event)
  matchesPlayed     Int   @default(0)
  matchesWon        Int   @default(0)
  matchesLost       Int   @default(0)
  matchesDrawn      Int   @default(0)
  framesWon         Int   @default(0)
  framesLost        Int   @default(0)
  pointsFor         Int   @default(0)
  pointsAgainst     Int   @default(0)
  breaksOver7       Int   @default(0)
  highBreak         Int   @default(0)
  highBreaks        Int[] @default([])   // top-N descending
  centuries         Int   @default(0)
  foulsCommitted    Int   @default(0)
  foulPointsConceded Int  @default(0)
  potsByColor       Json?                // { red: n, yellow: n, ... } lifetime

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  matchPlayers   V3MatchPlayer[]
  matchTypeStats V3PlayerMatchTypeStat[]
  practiceSessions V3PracticeSession[]

  @@map("v3_player")
}

model V3PlayerMatchTypeStat {
  id         String      @id @default(cuid())
  playerId   String
  player     V3Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  matchType  V3MatchType
  matchesPlayed Int @default(0)
  matchesWon    Int @default(0)
  matchesLost   Int @default(0)
  matchesDrawn  Int @default(0)
  framesWon     Int @default(0)
  framesLost    Int @default(0)
  highBreak     Int @default(0)
  updatedAt  DateTime @updatedAt

  @@unique([playerId, matchType])
  @@map("v3_player_match_type_stat")
}

model V3Match {
  id            String        @id @default(cuid())
  matchType     String                       // raw label as shown in UI
  matchTypeCode V3MatchType   @default(OTHER) // normalized
  inputMode     V3InputMode
  redsCount     Int           @default(15)
  bestOf        Int
  status        V3MatchStatus @default(ACTIVE)
  isDraw        Boolean       @default(false)
  winnerPlayerIndex Int?

  tableNumber   Int?
  locationId    String?
  location      Location?     @relation(fields: [locationId], references: [id])
  deviceId      String?
  remoteRoomId  String?

  startedAt     DateTime      @default(now())
  finishedAt    DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  players        V3MatchPlayer[]
  frames         V3Frame[]
  breaks         V3Break[]
  events         V3Event[]
  remoteSessions V3RemoteSession[]
  remoteEvents   V3RemoteEvent[]

  @@index([status])
  @@index([tableNumber])
  @@index([matchTypeCode])
  @@index([startedAt])
  @@map("v3_match")
}

model V3MatchPlayer {
  id              String   @id @default(cuid())
  matchId         String
  match           V3Match  @relation(fields: [matchId], references: [id], onDelete: Cascade)
  playerIndex     Int      // 0 or 1
  playerId        String?
  player          V3Player? @relation(fields: [playerId], references: [id])
  name            String
  nationalityIOC  String?
  club            String?
  startingHandicap Int     @default(0)
  framesWon       Int      @default(0)
  isWinner        Boolean  @default(false)
  highBreak       Int      @default(0)
  highBreaks      Int[]    @default([])
  pointsFor       Int      @default(0)
  pointsAgainst   Int      @default(0)

  @@unique([matchId, playerIndex])
  @@index([name])
  @@map("v3_match_player")
}

model V3Frame {
  id                 String        @id @default(cuid())
  matchId            String
  match              V3Match       @relation(fields: [matchId], references: [id], onDelete: Cascade)
  frameNumber        Int
  redsCount          Int
  inputMode          V3InputMode
  breakerPlayerIndex Int?
  winnerPlayerIndex  Int?
  scoreP0            Int           @default(0)
  scoreP1            Int           @default(0)
  rerackCount        Int           @default(0)
  respottedBlack     Boolean       @default(false)
  status             V3FrameStatus @default(IN_PROGRESS)
  startedAt          DateTime      @default(now())
  endedAt            DateTime?

  breaks V3Break[]
  balls  V3Ball[]
  events V3Event[]

  @@unique([matchId, frameNumber])
  @@map("v3_frame")
}

model V3Break {
  id           String   @id @default(cuid())
  matchId      String
  match        V3Match  @relation(fields: [matchId], references: [id], onDelete: Cascade)
  frameId      String
  frame        V3Frame  @relation(fields: [frameId], references: [id], onDelete: Cascade)
  playerIndex  Int
  sequence     Int      // order of this break within the frame
  totalPoints  Int      @default(0)
  ballCount    Int      @default(0)
  isClearance  Boolean  @default(false)
  isManualEntry Boolean @default(false)  // true for break-entry mode whole-break
  endReason    V3BreakEndReason?
  // optional detail (manual break-entry "Break-Details")
  missType     V3MissType?
  ball         V3BallColor?
  pocket       V3Pocket?
  startedAt    DateTime @default(now())
  endedAt      DateTime?

  balls V3Ball[]

  @@index([frameId])
  @@index([matchId])
  @@map("v3_break")
}

model V3Ball {
  id                 String      @id @default(cuid())
  breakId            String
  break              V3Break     @relation(fields: [breakId], references: [id], onDelete: Cascade)
  frameId            String
  frame              V3Frame     @relation(fields: [frameId], references: [id], onDelete: Cascade)
  sequence           Int         // order within the break
  ballType           V3BallType
  points             Int
  isFreeBall         Boolean     @default(false)
  phase              V3BBPhase
  redsRemainingAfter Int?
  createdAt          DateTime    @default(now())

  @@index([breakId])
  @@map("v3_ball")
}

// ===================== v3 FIREHOSE =====================

model V3Event {
  id            String        @id @default(cuid())
  matchId       String
  match         V3Match       @relation(fields: [matchId], references: [id], onDelete: Cascade)
  frameId       String?
  frame         V3Frame?      @relation(fields: [frameId], references: [id])
  breakId       String?
  seq           Int           // monotonic per match, assigned by API
  type          V3EventType
  playerIndex   Int?
  ballType      V3BallType?
  points        Int           @default(0)
  missType      V3MissType?
  pocket        V3Pocket?
  isFreeBall    Boolean       @default(false)
  freeBallGranted Boolean?
  phase         V3BBPhase?
  redsRemaining Int?
  oldReds       Int?
  newReds       Int?
  source        V3EventSource @default(DISPLAY)
  remotePlayerIndex Int?
  wasUndone     Boolean       @default(false)
  manualFlagToIgnore Boolean  @default(false) // carries the break-flag feature
  label         String?
  payload       Json?         // full raw blob for anything not covered above
  clientTs      DateTime?     // timestamp from the device
  createdAt     DateTime      @default(now())

  @@unique([matchId, seq])
  @@index([matchId])
  @@index([type])
  @@map("v3_event")
}

// ===================== v3 REMOTE =====================

model V3RemoteSession {
  id                String   @id @default(cuid())
  matchId           String?
  match             V3Match? @relation(fields: [matchId], references: [id])
  roomId            String
  playerIndex       Int
  token             String
  connectCount      Int      @default(0)
  createdAt         DateTime @default(now())
  rotatedAt         DateTime?
  lastConnectedAt   DateTime?
  lastDisconnectedAt DateTime?

  events V3RemoteEvent[]

  @@index([roomId])
  @@map("v3_remote_session")
}

model V3RemoteEvent {
  id            String            @id @default(cuid())
  matchId       String?
  match         V3Match?          @relation(fields: [matchId], references: [id])
  roomId        String
  sessionId     String?
  session       V3RemoteSession?  @relation(fields: [sessionId], references: [id])
  type          V3RemoteEventType
  playerIndex   Int?
  commandType   String?           // the RemoteCommand.t value
  commandPayload Json?
  createdAt     DateTime          @default(now())

  @@index([roomId])
  @@index([matchId])
  @@map("v3_remote_event")
}

// ===================== v3 PRACTICE =====================

model V3PracticeSession {
  id          String          @id @default(cuid())
  playerId    String?
  player      V3Player?       @relation(fields: [playerId], references: [id])
  playerName  String
  routineId   String
  routineName String
  mode        V3PracticeMode
  seriesMode  Boolean         @default(false)
  redsCount   Int?
  deviceId    String?
  tableNumber Int?
  locationId  String?
  location    Location?       @relation(fields: [locationId], references: [id])
  startedAt   DateTime        @default(now())
  finishedAt  DateTime?
  finalized   Boolean         @default(false)

  // aggregates
  totalAttempts Int   @default(0)
  highestBreak  Int   @default(0)
  averageBreak  Float @default(0)
  clearedCount  Int   @default(0)
  missedCount   Int   @default(0)
  hits          Int   @default(0)
  misses        Int   @default(0)
  bestStreak    Int   @default(0)

  attempts V3PracticeAttempt[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([playerName])
  @@index([routineId])
  @@map("v3_practice_session")
}

model V3PracticeAttempt {
  id         String                @id @default(cuid())
  sessionId  String
  session    V3PracticeSession     @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  orderIndex Int
  kind       V3PracticeAttemptKind
  value      Int?
  clearance  Boolean               @default(false)
  missType   V3MissType?
  ball       V3BallColor?
  pocket     V3Pocket?
  isFreeBall Boolean               @default(false)
  timestamp  DateTime              @default(now())

  @@unique([sessionId, orderIndex])
  @@index([sessionId])
  @@map("v3_practice_attempt")
}
```

> `Location` and `V3PracticeSession`/`V3Match` get back-relation fields added to the
> existing `Location` model (additive, no behavior change).

---

## Planned `/api/v3` endpoints

**Matches & play-by-play**
- `POST /api/v3/matches` — create match (matchType, inputMode, redsCount, bestOf, both players incl. club + handicap, table, location, deviceId, remoteRoomId). Creates `V3Match` + 2 `V3MatchPlayer` + frame 1, upserts `V3Player`s.
- `POST /api/v3/matches/:id/events` — append one or many events (the firehose). The API assigns `seq`, applies the event to derived state (frames, breaks, balls, scores), and updates aggregates. This is the single write path the UI uses for every action.
- `PATCH /api/v3/matches/:id` — status/winner/bestOf changes (end match, abort, extend).
- `PATCH /api/v3/events/:id/flag` — toggle `manualFlagToIgnore` (break leaderboard exclusion, like today).
- `GET /api/v3/matches/:id` — full match tree (players, frames, breaks, balls, events).
- `GET /api/v3/matches/live` — current match per table.

**Remote**
- `POST /api/v3/remote/:roomId/session` — mint/rotate token; logs `V3RemoteSession` + `SESSION_CREATED`/`SESSION_ROTATED`.
- SSE relay endpoints mirror today's behavior, additionally logging `PHONE_CONNECTED` / `PHONE_DISCONNECTED` / `COMMAND_RECEIVED` to `V3RemoteEvent` (and remote-originated scoring flows through `/events` with `source=REMOTE_PHONE`).

**Practice**
- `POST /api/v3/practice-sessions`, `PATCH /api/v3/practice-sessions/:id`,
  `POST /api/v3/practice-sessions/:id/attempts`,
  `DELETE /api/v3/practice-sessions/:id/attempts/last`,
  `GET /api/v3/practice-sessions[/:id]`.

**Players / aggregates**
- `GET /api/v3/players` — list.
- `GET /api/v3/players/:name` — profile + lifetime aggregates + per-match-type breakdown.
- `GET /api/v3/players/:name/breaks`, `/api/v3/breaks/leaderboard`, etc. as needed.

---

## UI changes (after approval)

- `lib/api.ts`: add a `v3` client (createMatchV3, appendEvents, etc.) alongside the
  existing one.
- `App.tsx`: every scoring handler (`addPoints`, `handleBBPot`, `handleBBFoul`,
  `handleBBMiss`, `handleBBCorrectReds`, `rerack`, `endFrame`, `undo*`, `redo`,
  `handleEditLastBreak`, respotted-black) emits a rich v3 event with full detail
  (ballType, phase, redsRemaining, isFreeBall, source). Remote commands thread
  `fromPlayerIndex` so events are tagged `REMOTE_PHONE`.
- Solo/practice handlers point at the v3 practice endpoints.
- `useRemoteHost` / remote relay: unchanged UX; the API logs the meta events.

Everything stays **local only** — no prod DB, no deploy, no merge to main.
