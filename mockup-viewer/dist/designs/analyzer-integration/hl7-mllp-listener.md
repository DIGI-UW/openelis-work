# HL7 v2.3.1 MLLP Listener Service — Functional Requirements Specification

**Version:** 1.0
**Date:** 2025-02-20
**Status:** Draft — Ready for Development Review
**Jira:** OGC-325
**Epic:** OGC-304 (Madagascar Analyzer Work)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the design and requirements for a generic HL7 v2.3.1 MLLP (Minimal Lower Layer Protocol) TCP listener service in OpenELIS Global. This service enables OpenELIS to receive results from laboratory analyzers that communicate using the HL7 v2.3.1 messaging standard over TCP/IP — a common protocol used by clinical chemistry, immunoassay, and other instrument families.

The HL7 MLLP Listener is a **platform service** — a reusable infrastructure component that instrument-specific adapters plug into. It handles the transport layer (TCP/IP socket management, MLLP framing), message parsing (HL7 segment extraction), and acknowledgment generation, while delegating instrument-specific interpretation (test code mapping, QC identification, result aggregation) to registered adapters.

### 1.2 Relationship to Existing ASTM Service

OpenELIS currently provides an **ASTM E1394/LIS2-A2 background service** that handles analyzers communicating via the ASTM protocol (e.g., Mindray BC-5380 hematology). The HL7 MLLP Listener is a **separate, parallel service** that runs alongside the ASTM service. Both can operate simultaneously on different ports to support mixed-protocol instrument environments.

| Aspect | ASTM Service (Existing) | HL7 MLLP Service (New) |
|--------|------------------------|------------------------|
| Protocol | ASTM E1394 / LIS2-A2 | HL7 v2.3.1 |
| Transport | RS-232 serial or TCP/IP | TCP/IP only |
| Framing | ENQ/ACK/EOT handshake | MLLP (`<VT>` ... `<FS><CR>`) |
| Message Structure | H\|P\|O\|R\|L records | MSH\|PID\|OBR\|OBX segments |
| Acknowledgment | Single-byte ACK (0x06) | Full HL7 ACK message with status codes |
| Results per session | Multiple R records in one ENQ/EOT session | One result per message (instrument-dependent) |
| Test identifiers | Mnemonic codes (e.g., `WBC`, `GLU`) | Varies: numeric IDs, mnemonic codes, or LOINC (instrument-dependent) |

### 1.3 Scope

**In scope:**
- TCP/IP socket management (listen, accept, keepalive, reconnect)
- MLLP frame parsing and construction
- HL7 v2.3.1 message parsing (segment/field/component extraction)
- ACK/NAK message generation
- Adapter plugin registration and routing
- Raw message logging for audit trail
- Configuration in Analyzer Management UI
- Bidirectional message support (inbound and outbound)

**Out of scope:**
- Instrument-specific test code mapping (handled by adapters)
- Instrument-specific QC identification (handled by adapters)
- Result aggregation logic (handled by adapters)
- The Analyzer Import review page (existing — see Analyzer Import FRS)
- RS-232 serial transport (HL7 MLLP is TCP/IP only)

### 1.4 Initial Adapter

The first adapter to use this service is the **Mindray BS-Series Chemistry Adapter** (OGC-326), covering BS-120 through BS-2000M clinical chemistry analyzers. The service is designed to support additional HL7 adapters in the future.

### 1.5 Reference Documents

| Document | Description |
|----------|-------------|
| HL7 v2.3.1 Standard | HL7 messaging standard, Chapter 2 (Control) |
| HL7 MLLP (RFC 6617) | Minimal Lower Layer Protocol for HL7 over TCP/IP |
| Mindray Host Interface Manual v5 | BA20-20-75337 — first instrument using this service |
| Mindray BS-Series Integration Spec v2 | Instrument-specific adapter spec |
| Analyzer Results Import FRS | QC-first workflow for reviewing imported results |

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OpenELIS Global                              │
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────┐              │
│  │  ASTM Service         │    │  HL7 MLLP Service     │             │
│  │  (existing)           │    │  (this document)      │             │
│  │                       │    │                       │             │
│  │  Port 9100: BC-5380   │    │  Port 5001: BS-480    │             │
│  │  Port 9101: Cobas     │    │  Port 5002: BS-800    │             │
│  │  Port 9102: ...       │    │  Port 5003: VIDAS     │             │
│  │                       │    │  Port 500N: ...       │             │
│  └──────────┬───────────┘    └──────────┬───────────┘             │
│             │                            │                          │
│             ▼                            ▼                          │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                   Result Pipeline                         │      │
│  │  Adapter → Test Mapping → QC Routing → Import Queue      │      │
│  └──────────────────────────────────────────────────────────┘      │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │              Analyzer Import Review Page                   │      │
│  │              (QC-first workflow)                            │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Service Components

```
HL7 MLLP Listener Service
├── TCP Socket Manager
│   ├── Port binding and listener thread (one per configured port)
│   ├── Connection accept and keepalive
│   ├── Connection lifecycle (connect, idle, disconnect, reconnect)
│   └── Thread pool for concurrent connections
│
├── MLLP Frame Handler
│   ├── Start Block detection (<VT> / 0x0B)
│   ├── End Block detection (<FS><CR> / 0x1C 0x0D)
│   ├── Frame assembly (buffering between SB and EB)
│   ├── Frame validation (proper framing characters)
│   └── Outbound frame wrapping (ACK/response messages)
│
├── HL7 Message Parser
│   ├── Delimiter extraction from MSH-1 and MSH-2
│   ├── Segment splitter (by <CR>)
│   ├── Field splitter (by |)
│   ├── Component splitter (by ^)
│   ├── Subcomponent splitter (by &)
│   ├── Repetition splitter (by ~)
│   ├── Escape sequence handler (\)
│   └── Parsed message object construction
│
├── Message Router
│   ├── Adapter registry (port → adapter mapping)
│   ├── Message type routing (ORU, QRY, ACK → adapter methods)
│   └── Fallback handling (unknown message types)
│
├── ACK Generator
│   ├── Success ACK (AA)
│   ├── Error ACK (AE) with error codes
│   ├── Reject ACK (AR) with reason codes
│   └── Message Control ID echo (MSA-2 = inbound MSH-10)
│
├── Audit Logger
│   ├── Raw message storage (inbound and outbound)
│   ├── Connection event logging
│   └── Error/exception logging
│
└── Configuration Manager
    ├── Port assignments per analyzer
    ├── Adapter registration
    ├── Enable/disable per analyzer
    └── Connection parameters (timeouts, buffer sizes)
```

### 2.3 Adapter Plugin Interface

Each instrument-specific adapter implements a standard interface to plug into the HL7 MLLP service:

```java
/**
 * Interface for instrument-specific HL7 adapters.
 * Each adapter handles message interpretation for one instrument family.
 */
public interface HL7AnalyzerAdapter {

    /**
     * Returns the unique adapter identifier.
     * Used for registration and configuration.
     */
    String getAdapterId();

    /**
     * Returns human-readable display name.
     */
    String getDisplayName();

    /**
     * Called when an ORU^R01 (result) message is received.
     * The adapter extracts test results, maps test codes, and
     * returns structured results for the import queue.
     *
     * @param message Parsed HL7 message object
     * @return List of extracted results (may be empty if QC/calibration)
     */
    List<AnalyzerResult> handleResultMessage(HL7Message message);

    /**
     * Called when a QRY^Q02 (query) message is received.
     * The adapter builds the appropriate response (QCK + DSR).
     * Return null if bidirectional is not supported.
     *
     * @param message Parsed HL7 query message
     * @return Response messages to send back, or null
     */
    List<HL7Message> handleQueryMessage(HL7Message message);

    /**
     * Called when an ACK^Q03 (query ack) message is received.
     * Used to confirm order download was received by the analyzer.
     *
     * @param message Parsed HL7 acknowledgment message
     */
    void handleQueryAcknowledgment(HL7Message message);

    /**
     * Determines if this adapter supports bidirectional communication.
     */
    boolean isBidirectional();

    /**
     * Returns the expected sending application (MSH-3) for routing.
     * Used when multiple adapters share a port (uncommon).
     */
    String getExpectedSendingApplication();
}
```

---

## 3. MLLP Transport Layer

### 3.1 Frame Structure

All HL7 messages are wrapped in MLLP framing per RFC 6617:

```
<SB> HL7_message_content <EB><CR>
```

| Character | Name | Hex | ASCII | Purpose |
|-----------|------|-----|-------|---------|
| `<SB>` | Start Block | `0x0B` | VT (Vertical Tab) | Marks beginning of HL7 message |
| `<EB>` | End Block | `0x1C` | FS (File Separator) | Marks end of HL7 message |
| `<CR>` | Carriage Return | `0x0D` | CR | Message terminator after End Block |

Within the HL7 message content, each segment is terminated by `<CR>` (0x0D).

### 3.2 Frame Parsing Rules

1. **Start detection:** Read bytes until `<SB>` (0x0B) is found. Discard any bytes before it.
2. **Content buffering:** Accumulate all bytes after `<SB>` into a message buffer.
3. **End detection:** When `<EB>` (0x1C) followed by `<CR>` (0x0D) is found, the frame is complete.
4. **Frame validation:** If content between `<SB>` and `<EB>` is empty, discard the frame.
5. **Buffer limits:** Maximum frame size of 1 MB. Discard and log error if exceeded.

### 3.3 Frame Construction (Outbound)

When sending ACK or response messages:

1. Construct the HL7 message content (segments separated by `<CR>`)
2. Wrap in MLLP: `<SB>` + content + `<EB>` + `<CR>`
3. Send as a single TCP write

### 3.4 TCP Connection Management

| Parameter | Default | Configurable | Description |
|-----------|---------|-------------|-------------|
| Listen Port | None (required) | Yes | TCP port per analyzer |
| Backlog | 5 | No | TCP listen backlog |
| Read Timeout | 300 seconds | Yes | Idle timeout before closing connection |
| Write Timeout | 30 seconds | Yes | Timeout for sending ACK |
| Buffer Size | 65536 bytes | Yes | TCP receive buffer |
| Max Frame Size | 1048576 bytes (1 MB) | Yes | Maximum MLLP frame size |
| Keepalive | Enabled | No | TCP keepalive to detect dead connections |

### 3.5 Connection Lifecycle

```
                    ┌─────────────┐
                    │  LISTENING   │
                    └──────┬──────┘
                           │ Accept connection
                           ▼
                    ┌─────────────┐
              ┌─────│  CONNECTED  │◄────────────┐
              │     └──────┬──────┘              │
              │            │ Receive frame       │
              │            ▼                     │
              │     ┌─────────────┐              │
              │     │  PROCESSING │              │
              │     └──────┬──────┘              │
              │            │ Send ACK            │
              │            ▼                     │
              │     ┌─────────────┐              │
              │     │  IDLE       │──────────────┘
              │     └──────┬──────┘   Next frame
              │            │ Timeout / Error / EOF
              │            ▼
              │     ┌─────────────┐
              └────►│  CLOSED     │
                    └─────────────┘
                           │
                    (Listener continues
                     accepting new connections)
```

**Key behaviors:**
- The listener thread continues accepting new connections after one closes.
- If the analyzer reconnects (new TCP connection), the service accepts it without manual intervention.
- Multiple analyzers can be connected simultaneously (each on its own port).
- If a connection drops mid-message (partial frame received), discard the buffer and log a warning.

---

## 4. HL7 v2.3.1 Message Parsing

### 4.1 Delimiter Extraction

HL7 delimiters are defined in the first two fields of the MSH segment:

- **MSH-1** (character position 4 in the segment string): Field separator (always `|`)
- **MSH-2** (next 4 characters): Encoding characters: Component `^`, Repetition `~`, Escape `\`, Subcomponent `&`

The parser MUST extract delimiters from each message rather than assuming defaults, though `|^~\&` is the universal standard.

### 4.2 Segment Parsing

1. Split the message content by `<CR>` (0x0D) to get individual segments.
2. The first 3 characters of each segment are the **segment ID** (e.g., `MSH`, `PID`, `OBR`, `OBX`).
3. Split the segment by the field separator (`|`) to get fields.
4. Fields are numbered starting from 1 (MSH-1 is the field separator itself, MSH-2 is the encoding characters, MSH-3 is the first "normal" field).

> **MSH segment note:** For the MSH segment, MSH-1 is the field separator character and MSH-2 is the encoding characters. These are special — they are not delimited by the field separator in the usual way. The parser must handle MSH differently: the first `|` after `MSH` is MSH-1, the next 4 characters are MSH-2, and then normal `|`-delimited parsing begins with MSH-3.

### 4.3 Component and Subcomponent Parsing

Fields can contain components (separated by `^`) and subcomponents (separated by `&`):

```
MSH-9: ORU^R01    →  Component 1: "ORU", Component 2: "R01"
OBR-4: Mindray^BS-480  →  Component 1: "Mindray", Component 2: "BS-480"
```

### 4.4 Repetition Handling

Fields can repeat (separated by `~`):

```
PID-3: MRN123~ALT456  →  Repetition 1: "MRN123", Repetition 2: "ALT456"
```

### 4.5 Escape Sequences

| Sequence | Represents |
|----------|-----------|
| `\F\` | Field separator (`\|`) |
| `\S\` | Component separator (`^`) |
| `\R\` | Repetition separator (`~`) |
| `\E\` | Escape character (`\`) |
| `\T\` | Subcomponent separator (`&`) |
| `\.br\` | Line break |
| `\Xhh\` | Hex-encoded character |

### 4.6 Parsed Message Object

The parser produces a structured object that adapters consume:

```java
public class HL7Message {
    private String rawContent;              // Original unparsed content
    private Map<String, String> delimiters; // Extracted delimiters
    private List<HL7Segment> segments;      // Parsed segments in order

    // Convenience accessors
    public String getMessageType();         // e.g., "ORU^R01"
    public String getMessageControlId();    // MSH-10
    public String getVersionId();           // MSH-12
    public String getSendingApplication();  // MSH-3
    public String getSendingFacility();     // MSH-4
    public String getTimestamp();           // MSH-7

    public HL7Segment getSegment(String segmentId);     // First matching
    public List<HL7Segment> getSegments(String segmentId); // All matching
}

public class HL7Segment {
    private String segmentId;               // e.g., "MSH", "OBX"
    private List<HL7Field> fields;          // Parsed fields

    public String getField(int index);                      // Raw field value
    public String getComponent(int fieldIndex, int compIndex); // Component
    public String getSubcomponent(int field, int comp, int sub);
    public List<String> getRepetitions(int fieldIndex);     // Repeated values
}
```

### 4.7 Supported Segment Types

The parser recognizes these HL7 v2.3.1 segments. All are parsed generically — the adapter interprets the fields.

| Segment | Name | Direction | Purpose |
|---------|------|-----------|---------|
| MSH | Message Header | Both | Present in every message |
| MSA | Message Acknowledgment | Both | Acknowledgment status |
| ERR | Error | Both | Error details |
| PID | Patient Identification | Inbound | Patient demographics |
| OBR | Observation Request | Inbound | Order/specimen info |
| OBX | Observation/Result | Inbound | Test result |
| QRD | Query Definition | Inbound | Query parameters |
| QRF | Query Filter | Inbound | Query filters |
| QAK | Query Acknowledgment | Both | Query response status |
| DSP | Display Data | Outbound | Data segments in query response |
| DSC | Continuation Pointer | Outbound | Pagination control |

---

## 5. ACK Generation

### 5.1 ACK Message Structure

Every inbound message that expects an acknowledgment gets a response. The ACK message consists of two segments:

**MSH (Message Header):**
```
MSH|^~\&||{ReceivingFacility}|{SendingApp}|{SendingFacility}|{Timestamp}||ACK^{TriggerEvent}|{NewControlId}|P|2.3.1||||{MSH16}||ASCII|||
```

| MSH Field | Source | Value |
|-----------|--------|-------|
| MSH-3 | — | Empty (OpenELIS does not populate sending app for ACKs) |
| MSH-4 | — | Empty or site name |
| MSH-5 | Inbound MSH-3 | Echo back the analyzer's sending application |
| MSH-6 | Inbound MSH-4 | Echo back the analyzer's sending facility |
| MSH-7 | System | Current timestamp (`YYYYMMDDHHmmss`) |
| MSH-9 | Derived | `ACK^R01` for ORU, `QCK^Q02` for QRY, `ACK^Q03` for DSR ack |
| MSH-10 | System | New unique message control ID |
| MSH-11 | Fixed | `P` (production) |
| MSH-12 | Fixed | `2.3.1` |
| MSH-16 | Inbound MSH-16 | Echo back the application ack type (important for QC discrimination) |
| MSH-18 | Fixed | `ASCII` |

**MSA (Acknowledgment):**
```
MSA|{AckCode}|{OriginalControlId}|{TextMessage}|||{StatusCode}|
```

| MSA Field | Purpose |
|-----------|---------|
| MSA-1 | Acknowledgment code: `AA`, `AE`, or `AR` |
| MSA-2 | **Must match MSH-10 of the inbound message** |
| MSA-3 | Human-readable status message |
| MSA-6 | Numeric status code |

### 5.2 Acknowledgment Codes

| Code | Name | When Used |
|------|------|-----------|
| `AA` | Application Accept | Message successfully received and processed |
| `AE` | Application Error | Message received but processing failed (recoverable) |
| `AR` | Application Reject | Message rejected (not processable) |

### 5.3 Status Codes

| Code | ACK | Description |
|------|-----|-------------|
| 0 | AA | Message accepted successfully |
| 100 | AE | Segment sequence error |
| 101 | AE | Required field missing |
| 102 | AE | Data type error |
| 103 | AE | Table value not found |
| 200 | AR | Unsupported message type |
| 201 | AR | Unsupported event code |
| 202 | AR | Unsupported processing ID |
| 203 | AR | Unsupported version ID |
| 204 | AR | Unknown key identifier |
| 205 | AR | Duplicate key identifier |
| 206 | AR | Application record locked |
| 207 | AR | Application internal error |

### 5.4 ACK Timing

The ACK must be sent **promptly** after receiving a message. Many analyzers have a short timeout (5–15 seconds) and will retry or flag a communication error if no ACK is received. The service should:

1. Parse the inbound message
2. Route to the adapter for processing
3. Generate ACK based on adapter result
4. Send ACK within the same TCP session

If the adapter throws an exception during processing, the service should still send an AE (Application Error) ACK rather than leaving the connection silent.

### 5.5 Idempotency

If the same Message Control ID (MSH-10) is received twice (retransmission), the service should:

1. Check if the message was already processed (by MSH-10 lookup)
2. If already processed: resend the original ACK without reprocessing
3. If not found: process normally

The service maintains a short-term cache of recently processed Message Control IDs (configurable, default 1000 entries or 1 hour).

---

## 6. Bidirectional Communication

### 6.1 Overview

Some HL7 analyzers support bidirectional communication — the analyzer queries OpenELIS for pending orders ("order download" or "host query"). This is optional and adapter-dependent. The MLLP service provides the transport infrastructure; the adapter builds the response content.

### 6.2 Query Flow

```
Analyzer                          MLLP Service                    Adapter
   │                                    │                            │
   │ ── QRY^Q02 ──────────────────────► │                            │
   │                                    │ ── handleQueryMessage() ──►│
   │                                    │ ◄── QCK + DSR messages ────│
   │ ◄── QCK^Q02 ─────────────────────  │                            │
   │ ◄── DSR^Q03 ─────────────────────  │                            │
   │ ── ACK^Q03 ──────────────────────► │                            │
   │                                    │ ── handleQueryAck() ──────►│
   │                                    │                            │
```

### 6.3 Batch Query Pagination

For batch queries returning multiple samples, the service sends one DSR per sample. The adapter controls pagination via the DSC (Continuation) segment:

- **Non-empty DSC:** More samples follow. The service sends the next DSR after receiving ACK^Q03.
- **Empty DSC:** This is the last sample. The service completes the batch.

### 6.4 Query Cancellation

If the analyzer sends a QRY^Q02 with a cancel indicator (adapter-specific, e.g., QRD-9 = `CAN` for Mindray), the service stops the batch download after the current DSR message.

---

## 7. Configuration

### 7.1 Analyzer Management Integration

The existing Analyzer Management admin page (Admin → Analyzers) gains a new protocol option:

| Field | Type | Description |
|-------|------|-------------|
| Protocol | Dropdown | `ASTM E1394 (Serial/TCP)`, **`HL7 v2.3.1 (MLLP)`**, `CSV File Import` |
| TCP Port | Number | Unique port for this analyzer's HL7 listener (required for HL7) |
| Bidirectional | Toggle | Enable order download queries (default: Off) |
| Active | Toggle | Enable/disable listener (default: On) |

When protocol is set to `HL7 v2.3.1 (MLLP)`:
- The TCP Port field becomes required
- Serial port fields are hidden
- The HL7-specific adapter dropdown appears (e.g., "Mindray BS-Series")

### 7.2 Port Assignment

Each HL7 analyzer requires a unique TCP port. The configuration UI should:

- Validate that the chosen port is not already in use by another analyzer
- Validate that the port is in an acceptable range (1024–65535)
- Show a warning if the port conflicts with known system services

### 7.3 Adapter Selection

| Field | Type | Description |
|-------|------|-------------|
| HL7 Adapter | Dropdown | Registered adapters (e.g., "Mindray BS-Series Chemistry") |

The adapter selection determines:
- How inbound messages are interpreted
- What test code mapping is available
- Whether bidirectional is supported
- What validation datasets apply

### 7.4 Test Code Mapping

Test code mapping is adapter-specific and configured per analyzer. For HL7 analyzers, the mapping table should support:

| Analyzer Code | → | OpenELIS Test | Active |
|---------------|---|---------------|--------|
| *(adapter-specific: numeric ID, mnemonic, etc.)* | → | *(OpenELIS test definition)* | Yes/No |

The format of "Analyzer Code" varies by adapter — some instruments use numeric IDs (Mindray BS), others use mnemonic codes (like ASTM instruments), others may use LOINC codes. The mapping UI should accommodate any string value.

### 7.5 Service Configuration

Global service configuration (Admin → System Configuration):

| Parameter | Default | Description |
|-----------|---------|-------------|
| `hl7.mllp.enabled` | `true` | Master enable/disable for HL7 MLLP service |
| `hl7.mllp.maxConnections` | `20` | Maximum simultaneous connections |
| `hl7.mllp.readTimeout` | `300` | Seconds before closing idle connection |
| `hl7.mllp.writeTimeout` | `30` | Seconds timeout for sending ACK |
| `hl7.mllp.maxFrameSize` | `1048576` | Maximum MLLP frame size in bytes |
| `hl7.mllp.auditRetention` | `365` | Days to retain raw HL7 message logs |
| `hl7.mllp.idempotencyCacheSize` | `1000` | Message Control ID cache size |

---

## 8. Audit Trail

### 8.1 Raw Message Logging

Every HL7 message (inbound and outbound) is stored for audit purposes:

```sql
CREATE TABLE hl7_message_log (
    id BIGSERIAL PRIMARY KEY,
    analyzer_id INTEGER NOT NULL REFERENCES analyzer(id),
    direction VARCHAR(10) NOT NULL,          -- 'INBOUND' or 'OUTBOUND'
    message_type VARCHAR(20),                -- e.g., 'ORU^R01', 'ACK^R01'
    message_control_id VARCHAR(50),          -- MSH-10
    raw_content TEXT NOT NULL,               -- Complete MLLP frame content
    ack_code VARCHAR(5),                     -- AA, AE, AR (for ACK messages)
    processing_status VARCHAR(20) NOT NULL,  -- RECEIVED, PROCESSED, ERROR, DUPLICATE
    error_message TEXT,                      -- Error details if processing failed
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    source_ip VARCHAR(45),                   -- Connecting analyzer IP
    source_port INTEGER                      -- Connecting analyzer port
);

CREATE INDEX idx_hl7_log_analyzer ON hl7_message_log(analyzer_id);
CREATE INDEX idx_hl7_log_timestamp ON hl7_message_log(received_at);
CREATE INDEX idx_hl7_log_control_id ON hl7_message_log(message_control_id);
CREATE INDEX idx_hl7_log_status ON hl7_message_log(processing_status);
```

### 8.2 Connection Event Logging

```sql
CREATE TABLE hl7_connection_log (
    id BIGSERIAL PRIMARY KEY,
    analyzer_id INTEGER REFERENCES analyzer(id),
    event_type VARCHAR(20) NOT NULL,    -- CONNECT, DISCONNECT, TIMEOUT, ERROR
    source_ip VARCHAR(45),
    source_port INTEGER,
    listen_port INTEGER NOT NULL,
    event_detail TEXT,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 8.3 Retention

- Raw HL7 message logs are retained for a configurable period (default 365 days)
- Connection logs are retained for 90 days
- A scheduled job purges expired records nightly

---

## 9. Error Handling

### 9.1 Transport Errors

| Error | Handling |
|-------|----------|
| Port already in use | Log error at startup, mark analyzer as "Connection Error" in UI |
| Connection refused by firewall | Not detectable (analyzer connects to us) — no action needed |
| Connection drop mid-frame | Discard partial buffer, log warning, continue listening |
| Read timeout (idle connection) | Close connection gracefully, log info, continue listening |
| Write timeout (ACK send fails) | Log warning, close connection, analyzer will retry |
| Maximum frame size exceeded | Discard frame, log error, send AR ACK if possible |

### 9.2 Protocol Errors

| Error | Handling | ACK |
|-------|----------|-----|
| Missing `<SB>` start block | Discard data until next `<SB>`, log warning | None |
| Missing `<EB><CR>` end block | Timeout will eventually trigger, discard buffer | None |
| Empty message content | Discard, log warning | None |
| MSH segment missing or malformed | Log error with raw content | AR (200) |
| Unsupported message type | Log warning | AR (200) |
| Unsupported HL7 version | Log warning, attempt processing anyway | AE (203) |
| Required field missing (adapter-determined) | Log warning | AE (101) |

### 9.3 Processing Errors

| Error | Handling | ACK |
|-------|----------|-----|
| Adapter throws exception | Log error with stack trace, raw message | AE (207) |
| Adapter returns null (unhandled message type) | Log info | AA (0) |
| Test code mapping not found | Adapter handles (skip result, log warning) | AA (0) |
| Database write failure | Log error, rollback | AE (207) |

### 9.4 Recovery

The service is designed for automatic recovery:

- If a connection drops, the listener continues accepting new connections
- If an analyzer retransmits (same Message Control ID), the service deduplicates
- If the service is restarted, all configured listeners start automatically
- If an adapter fails on one message, subsequent messages are still processed

---

## 10. Monitoring

### 10.1 Service Status

The Analyzer Management page should display connection status for each HL7 analyzer:

| Status | Badge | Description |
|--------|-------|-------------|
| `label.analyzer.status.listening` | Blue | Listener active, no connection |
| `label.analyzer.status.connected` | Green | Analyzer connected and communicating |
| `label.analyzer.status.idle` | Yellow | Connected but no recent messages |
| `label.analyzer.status.error` | Red | Connection error or port conflict |
| `label.analyzer.status.disabled` | Gray | Listener disabled |

### 10.2 Statistics

Per-analyzer statistics available in the admin UI:

| Metric | Description |
|--------|-------------|
| Messages received (today) | Count of inbound HL7 messages |
| Messages processed (today) | Count successfully routed to adapter |
| Messages errored (today) | Count that generated AE/AR responses |
| Last message received | Timestamp of most recent inbound message |
| Last connection | Timestamp of most recent TCP connection |
| Uptime | Duration since last listener restart |

---

## 11. Startup and Lifecycle

### 11.1 Service Startup

When OpenELIS starts:

1. Load all analyzers configured with protocol `HL7 v2.3.1 (MLLP)` and `active = true`
2. For each analyzer, start a TCP listener on the configured port
3. Register the configured adapter for each listener
4. Log startup status for each listener (success/failure with port)
5. If a port fails to bind, mark the analyzer as error status and continue starting others

### 11.2 Hot Reload

When an analyzer configuration is changed in the admin UI:

- **New analyzer added:** Start a new listener on the configured port
- **Analyzer port changed:** Stop old listener, start new listener on new port
- **Analyzer deactivated:** Stop the listener, close active connections
- **Analyzer reactivated:** Start the listener
- **Adapter changed:** Stop listener, re-register new adapter, restart listener

### 11.3 Graceful Shutdown

When OpenELIS shuts down:

1. Stop accepting new connections on all HL7 ports
2. Wait up to 30 seconds for in-progress messages to complete
3. Send AE ACK for any pending messages that didn't complete
4. Close all connections
5. Log shutdown status

---

## 12. Localization Tags

| Tag | English Default |
|-----|----------------|
| `label.analyzer.protocol.hl7` | HL7 v2.3.1 (MLLP) |
| `label.analyzer.protocol.astm` | ASTM E1394 (Serial/TCP) |
| `label.analyzer.protocol.csv` | CSV File Import |
| `label.analyzer.hl7.port` | HL7 TCP Port |
| `label.analyzer.hl7.port.required` | TCP port is required for HL7 analyzers |
| `label.analyzer.hl7.port.conflict` | Port {0} is already in use by {1} |
| `label.analyzer.hl7.port.range` | Port must be between 1024 and 65535 |
| `label.analyzer.hl7.adapter` | HL7 Adapter |
| `label.analyzer.hl7.adapter.select` | Select an HL7 adapter |
| `label.analyzer.hl7.bidirectional` | Bidirectional (Order Download) |
| `label.analyzer.hl7.bidirectional.description` | Enable analyzer to query for pending orders |
| `label.analyzer.status.listening` | Listening |
| `label.analyzer.status.connected` | Connected |
| `label.analyzer.status.idle` | Idle |
| `label.analyzer.status.error` | Connection Error |
| `label.analyzer.status.disabled` | Disabled |
| `label.analyzer.hl7.messageAccepted` | Message accepted |
| `label.analyzer.hl7.messageRejected` | Message rejected |
| `label.analyzer.hl7.parseError` | HL7 message parse error |
| `label.analyzer.hl7.ackTimeout` | Acknowledgment timeout |
| `label.analyzer.hl7.connectionEstablished` | Connection established from {0} |
| `label.analyzer.hl7.connectionClosed` | Connection closed |
| `label.analyzer.hl7.duplicateMessage` | Duplicate message (retransmission) |
| `label.analyzer.hl7.unsupportedMessageType` | Unsupported message type: {0} |
| `label.analyzer.hl7.stats.received` | Messages Received |
| `label.analyzer.hl7.stats.processed` | Messages Processed |
| `label.analyzer.hl7.stats.errors` | Errors |
| `label.analyzer.hl7.stats.lastMessage` | Last Message |
| `label.analyzer.hl7.stats.lastConnection` | Last Connection |
| `label.analyzer.hl7.stats.uptime` | Uptime |

---

## 13. Acceptance Criteria

### 13.1 TCP/MLLP Transport
- [ ] **AC-01**: Listener starts on configured port(s) when OpenELIS starts
- [ ] **AC-02**: Multiple listeners can run simultaneously (one per HL7 analyzer)
- [ ] **AC-03**: Connections accepted from any IP (analyzer connects as client)
- [ ] **AC-04**: MLLP `<SB>` start block correctly detected
- [ ] **AC-05**: MLLP `<EB><CR>` end block correctly detected
- [ ] **AC-06**: Partial frames buffered until complete
- [ ] **AC-07**: Oversized frames (>1 MB) rejected and logged
- [ ] **AC-08**: Idle connections closed after timeout
- [ ] **AC-09**: Listener continues accepting connections after one closes
- [ ] **AC-10**: Connection drop mid-frame handled gracefully (no crash)

### 13.2 HL7 Parsing
- [ ] **AC-11**: Delimiters extracted from MSH-1 and MSH-2 (not hardcoded)
- [ ] **AC-12**: Segments split by `<CR>` correctly
- [ ] **AC-13**: Fields split by `|` correctly, including empty fields
- [ ] **AC-14**: Components split by `^` correctly
- [ ] **AC-15**: Subcomponents split by `&` correctly
- [ ] **AC-16**: Repetitions split by `~` correctly
- [ ] **AC-17**: MSH segment parsed correctly (special handling for MSH-1/MSH-2)
- [ ] **AC-18**: Escape sequences handled (`\F\`, `\S\`, etc.)
- [ ] **AC-19**: Parsed message object provides field/component/subcomponent access

### 13.3 ACK Generation
- [ ] **AC-20**: ACK generated for every inbound ORU^R01
- [ ] **AC-21**: MSA-2 in ACK matches MSH-10 of inbound message
- [ ] **AC-22**: AA status code (0) for successfully processed messages
- [ ] **AC-23**: AE status code with appropriate error code for processing failures
- [ ] **AC-24**: AR status code for unparseable or unsupported messages
- [ ] **AC-25**: ACK wrapped in proper MLLP framing before sending
- [ ] **AC-26**: ACK sent within timeout period (analyzer doesn't time out)

### 13.4 Adapter Integration
- [ ] **AC-27**: Adapters register with the service at startup
- [ ] **AC-28**: Inbound messages routed to correct adapter (by port assignment)
- [ ] **AC-29**: Adapter `handleResultMessage` called for ORU^R01 messages
- [ ] **AC-30**: Adapter `handleQueryMessage` called for QRY^Q02 messages (if bidirectional)
- [ ] **AC-31**: Adapter exceptions caught, AE ACK sent, service continues

### 13.5 Idempotency
- [ ] **AC-32**: Duplicate Message Control IDs detected
- [ ] **AC-33**: Duplicate messages return same ACK without reprocessing
- [ ] **AC-34**: Cache expires old entries to prevent memory growth

### 13.6 Configuration
- [ ] **AC-35**: New protocol option "HL7 v2.3.1 (MLLP)" in Analyzer Management
- [ ] **AC-36**: TCP port field required when HL7 protocol selected
- [ ] **AC-37**: Port uniqueness validated (no two analyzers share a port)
- [ ] **AC-38**: Port range validated (1024–65535)
- [ ] **AC-39**: Adapter dropdown shows registered HL7 adapters
- [ ] **AC-40**: Hot reload: new analyzer starts listener without restart
- [ ] **AC-41**: Hot reload: deactivated analyzer stops listener

### 13.7 Audit and Monitoring
- [ ] **AC-42**: Raw HL7 messages stored in audit log (inbound and outbound)
- [ ] **AC-43**: Connection events logged (connect, disconnect, timeout, error)
- [ ] **AC-44**: Processing errors logged with raw message content
- [ ] **AC-45**: Connection status displayed in Analyzer Management UI
- [ ] **AC-46**: Per-analyzer statistics available (message counts, last activity)
- [ ] **AC-47**: Audit log retention enforced by scheduled purge job

### 13.8 Coexistence
- [ ] **AC-48**: HL7 service runs alongside ASTM service without conflicts
- [ ] **AC-49**: Both services can be active simultaneously
- [ ] **AC-50**: Separate port ranges for HL7 and ASTM (no overlap validation)

### 13.9 Localization
- [ ] **AC-51**: All UI labels use localization tags (no hardcoded text)
- [ ] **AC-52**: Error messages use localization tags with parameter substitution

---

## 14. Future Considerations

### 14.1 HL7 FHIR Bridge

The HL7 v2.3.1 MLLP Listener could be extended to support HL7 FHIR R4 over HTTP in the future. The adapter interface is designed to be protocol-agnostic at the result level — only the transport and parsing layers would change.

### 14.2 Additional HL7 Adapters

Instruments that may use HL7 v2.x and could benefit from future adapters:

- Roche Cobas (some models use HL7)
- Siemens Atellica (HL7 option)
- Beckman Coulter AU (HL7 option)
- Abbott Architect (HL7 option)
- BioMérieux VITEK 2 (HL7 option)

### 14.3 HL7 v2.5.1 Support

Some newer instruments use HL7 v2.5.1 instead of v2.3.1. The segment structure is largely backward-compatible. The parser should be designed to accept v2.5.1 messages without modification (the version is informational — the segment/field structure is the same).

---

## 15. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-02-20 | Casey Iiams-Hauser | Initial release |
