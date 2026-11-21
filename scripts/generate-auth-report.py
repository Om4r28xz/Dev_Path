from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "DevPath_Authentication_System_Report_CORRECTED.pdf"

NAVY = colors.HexColor("#0F172A")
BLUE = colors.HexColor("#2563EB")
PURPLE = colors.HexColor("#7C3AED")
ORANGE = colors.HexColor("#D97706")
GREEN = colors.HexColor("#059669")
SLATE = colors.HexColor("#334155")
MUTED = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#F1F5F9")
BORDER = colors.HexColor("#CBD5E1")


class ReportDoc(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=LETTER,
            leftMargin=0.65 * inch,
            rightMargin=0.65 * inch,
            topMargin=0.72 * inch,
            bottomMargin=0.62 * inch,
            title="DevPath Authentication System Technical Report",
            author="DevPath team",
            subject="Verified architecture and security specification",
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="report", frames=[frame], onPage=self.draw_chrome))

    def draw_chrome(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(BLUE)
        canvas.setLineWidth(1.2)
        canvas.line(doc.leftMargin, LETTER[1] - 0.42 * inch, LETTER[0] - doc.rightMargin, LETTER[1] - 0.42 * inch)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.setFillColor(NAVY)
        canvas.drawString(doc.leftMargin, LETTER[1] - 0.34 * inch, "DEVPATH - VERIFIED AUTHENTICATION AND ARCHITECTURE REPORT")
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawRightString(LETTER[0] - doc.rightMargin, LETTER[1] - 0.34 * inch, "EVIDENCE 4")
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.6)
        canvas.line(doc.leftMargin, 0.43 * inch, LETTER[0] - doc.rightMargin, 0.43 * inch)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, 0.27 * inch, "Verified against DevPath v0.4.0 source and contracts")
        canvas.drawRightString(LETTER[0] - doc.rightMargin, 0.27 * inch, f"Page {doc.page}")
        canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleX", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=23, leading=27, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name="Subtitle", parent=styles["Normal"], fontSize=11, leading=15, textColor=MUTED, spaceAfter=18))
styles.add(ParagraphStyle(name="H1X", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=NAVY, spaceBefore=5, spaceAfter=7))
styles.add(ParagraphStyle(name="H2X", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=NAVY, spaceBefore=4, spaceAfter=5))
styles.add(ParagraphStyle(name="BodyX", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.9, leading=12.2, textColor=SLATE, spaceAfter=7))
styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.5, leading=9.4, textColor=SLATE))
styles.add(ParagraphStyle(name="SmallCenter", parent=styles["Small"], alignment=TA_CENTER))
styles.add(ParagraphStyle(name="SmallWhite", parent=styles["Small"], textColor=colors.white, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="SmallWhiteCenter", parent=styles["SmallWhite"], alignment=TA_CENTER))
styles.add(ParagraphStyle(name="Callout", parent=styles["BodyX"], backColor=LIGHT, borderColor=BLUE, borderWidth=0, borderPadding=9, leftIndent=3, spaceAfter=12))
styles.add(ParagraphStyle(name="CodeX", parent=styles["Small"], fontName="Courier", fontSize=7.2, leading=9.2, backColor=LIGHT, borderPadding=8, spaceAfter=8))


def p(text, style="BodyX"):
    return Paragraph(text, styles[style])


def table(rows, widths, header=True, font_size=7.1):
    data = [
        [p(str(cell), "SmallWhite" if header and row_index == 0 else "Small") for cell in row]
        for row_index, row in enumerate(rows)
    ]
    result = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.45, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("FONT", (0, 0), (-1, -1), "Helvetica", font_size),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    for row in range(1 if header else 0, len(rows)):
        if row % 2 == 0:
            commands.append(("BACKGROUND", (0, row), (-1, row), LIGHT))
    result.setStyle(TableStyle(commands))
    return result


def flow_boxes(labels, box_colors):
    cells = []
    for index, label in enumerate(labels):
        cells.append(p(label, "SmallWhiteCenter"))
        if index < len(labels) - 1:
            cells.append(p("-&gt;", "SmallCenter"))
    widths = []
    for index in range(len(cells)):
        widths.append(1.55 * inch if index % 2 == 0 else 0.28 * inch)
    result = Table([cells], colWidths=widths, hAlign="CENTER")
    commands = [("VALIGN", (0, 0), (-1, -1), "MIDDLE")]
    for index, color in enumerate(box_colors):
        cell = index * 2
        commands += [
            ("BACKGROUND", (cell, 0), (cell, 0), color),
            ("TEXTCOLOR", (cell, 0), (cell, 0), colors.white),
            ("BOX", (cell, 0), (cell, 0), 0.8, color),
            ("LEFTPADDING", (cell, 0), (cell, 0), 7),
            ("RIGHTPADDING", (cell, 0), (cell, 0), 7),
            ("TOPPADDING", (cell, 0), (cell, 0), 11),
            ("BOTTOMPADDING", (cell, 0), (cell, 0), 11),
        ]
    result.setStyle(TableStyle(commands))
    return result


story = []

# Page 1
story += [
    Spacer(1, 0.15 * inch),
    p("Authentication System Technical Report", "TitleX"),
    p("Unit 3 - Activity 4 and Evidence 4: implemented topology, security, contracts, and resilience", "Subtitle"),
    p("<b>Repository audit correction.</b> Authentication is an embedded module of the main Express API. The independent microservice is the Skill Engine. JSearch is called by the API JobsProvider, never by the browser or Skill Engine. This edition removes routes, claims, and fallback behavior that do not exist in the source.", "Callout"),
    p("1. Implemented architecture and decision", "H1X"),
    p("DevPath uses a React/Vite browser client, a main Express API, PostgreSQL, and an independent Express Skill Engine. The API owns identity, authorization, persistence, projects, private CV storage, saved analyses, jobs provider access, and learning paths. The Skill Engine receives only analysis text and canonical skill identifiers over an internal authenticated REST call; it receives no user JWT or personal profile."),
    flow_boxes(["React/Vite browser<br/>relative /api/v1 calls", "Main Express API<br/>embedded auth and business modules", "PostgreSQL 16<br/>private persistence"], [BLUE, NAVY, PURPLE]),
    Spacer(1, 8),
    flow_boxes(["Main Express API<br/>POST /internal/v1/analyze", "Skill Engine<br/>deterministic matching", "Versioned catalog<br/>10 technologies"], [NAVY, ORANGE, GREEN]),
    Spacer(1, 10),
    table([
        ["Dimension", "Embedded Express auth - implemented", "Standalone auth service - not implemented", "External identity provider - not implemented"],
        ["Boundary", "Middleware and services inside apps/api", "Separate deployment and service contract", "Vendor-managed identity"],
        ["Data control", "Users, refresh families, profiles, and ownership remain in PostgreSQL", "Would require cross-service identity coordination", "Credentials and policy partly controlled by vendor"],
        ["Operational cost", "No extra service; API verifies RS256 locally", "Additional health, network, and deployment surface", "Vendor dependency and pricing constraints"],
        ["Verified choice", "Matches repository topology and current scope", "Not present in DevPath", "Not present in DevPath"],
    ], [1.0*inch, 2.0*inch, 1.85*inch, 1.75*inch]),
    p("Architectural conclusion", "H2X"),
    p("The embedded module is appropriate for the current monolith-plus-engine topology. It must not be presented as a third microservice. The Skill Engine is the independently deployed internal microservice used by the application."),
    PageBreak(),
]

# Page 2
story += [
    p("2. Authentication workflows", "H1X"),
    p("2.1 Registration and login", "H2X"),
    p("Registration validates name, normalized email, and password; hashes the password with Argon2id; inserts the account, profile, session family, and hashed refresh token transactionally; then returns a short-lived access token and sets an opaque refresh cookie. Login performs an Argon2id verification even on the missing-account path to reduce account-enumeration timing differences."),
    table([
        ["Step", "Caller", "Implemented operation", "Result"],
        ["1", "Browser", "POST /api/v1/auth/register or /auth/login", "Validated JSON over the public API"],
        ["2", "Express auth module", "Argon2id hash/verify; parameterized PostgreSQL queries", "Account or 401/409 structured error"],
        ["3", "Express auth module", "Sign RS256 access JWT; create random refresh token", "200/201 JSON plus HttpOnly cookie"],
    ], [0.45*inch, 1.15*inch, 3.15*inch, 1.75*inch]),
    p("2.2 Protected request and analysis", "H2X"),
    table([
        ["Hop", "Authentication and data boundary"],
        ["Browser -> API", "Authorization: Bearer &lt;access JWT&gt;. Middleware verifies RS256, typ, issuer, audience, expiry, candidate role, UUID subject, and UUID jti."],
        ["API -> PostgreSQL", "Owner identity comes only from the verified subject. SQL filters by user_id; foreign resources return 404."],
        ["API -> Skill Engine", "POST /internal/v1/analyze with a separate service Bearer secret and X-Request-Id. Body contains source text and skill IDs, not user identity."],
        ["Skill Engine -> API", "Bounded JSON response with required/matched/missing IDs, percentage, warnings, and evidence. API validates invariants before persistence."],
    ], [1.35*inch, 5.15*inch]),
    p("2.3 Refresh rotation and logout", "H2X"),
    p("POST /api/v1/auth/refresh consumes the HttpOnly cookie, locks the stored SHA-256 token hash, rejects expiry or revocation, detects reuse, rotates once, and preserves the original seven-day absolute expiry. Reuse revokes the refresh family. POST /api/v1/auth/logout revokes the family when a token is present and clears the cookie. An issued access token remains valid only until its 15-minute expiry."),
    table([
        ["Control", "Implemented value"],
        ["Password hashing", "Argon2id; memoryCost 19456, timeCost 2, parallelism 1, hashLength 32"],
        ["Access token", "RS256; RSA key at least 2048 bits; 900 seconds; stored only in browser memory"],
        ["Refresh token", "32 random bytes encoded base64url; only SHA-256 hash stored; seven-day absolute expiry"],
        ["Cookie", "HttpOnly, SameSite=Strict, Path=/api/v1/auth; Secure outside explicit local HTTP"],
    ], [1.55*inch, 4.95*inch]),
    PageBreak(),
]

# Page 3
story += [
    p("3. JWT claims and authorization model", "H1X"),
    p("The access token does not contain email, password, profile data, recruiter/admin roles, or provider credentials. DevPath currently accepts the single application role candidate and authorizes records by the verified subject."),
    p('{\n  "alg": "RS256", "typ": "at+jwt",\n  "sub": "&lt;user UUID&gt;", "role": "candidate",\n  "iss": "urn:devpath:auth", "aud": "devpath-api",\n  "iat": &lt;unix seconds&gt;, "exp": &lt;iat + 900&gt;, "jti": "&lt;UUID&gt;"\n}', "CodeX"),
    p("4. Public and internal interface contracts", "H1X"),
    table([
        ["Boundary", "Route", "Auth", "Representative outcomes"],
        ["Browser -> API", "POST /api/v1/auth/register", "Public", "201; 400; 409; 413; 429"],
        ["Browser -> API", "POST /api/v1/auth/login", "Public", "200; 400; 401; 429"],
        ["Browser -> API", "POST /api/v1/auth/refresh", "Refresh cookie", "200; 401; 403; 429; 503"],
        ["Browser -> API", "POST /api/v1/analyses", "Access JWT", "200 replay; 201; 400; 401; 409; 503; 504"],
        ["Browser -> API", "GET /api/v1/jobs and /jobs/details", "Access JWT", "200; 400; 401; 404; 429; 503; 504"],
        ["API -> engine", "POST /internal/v1/analyze", "Service Bearer", "200; 400; 401; 413; 422; 500"],
        ["API -> JSearch", "GET /search-v2 and /job-details", "X-RapidAPI-Key", "Normalized success; 404; 429; timeout/provider failure"],
    ], [1.15*inch, 2.55*inch, 1.15*inch, 1.65*inch]),
    p("The API also protects profile and skills, projects CRUD, private CV upload/download/delete, analysis history, and learning path routes. OpenAPI documents and 54 validated JSON examples define successful and error shapes. The M3/M4 filenames retain their historical proposed label, but the corresponding accepted routes are implemented and regression-tested in v0.4.0."),
    p("JSearch safety boundary", "H2X"),
    p("JobsProvider is part of the main API. fixture mode is the safe default and is visibly labeled. live mode requires an explicit enable flag and a backend-only RAPIDAPI_KEY. The host and paths are fixed, requests are bounded by timeout and maximum response size, provider cursors are encrypted before exposure, and 429 is not automatically retried. A live provider failure returns a structured error; the implementation does not silently switch to fixture data."),
    PageBreak(),
]

# Page 4
story += [
    p("5. Implemented component topology", "H1X"),
    flow_boxes(["React/Vite<br/>no secrets", "Express API<br/>auth + domain modules", "PostgreSQL 16<br/>owner-scoped data"], [BLUE, NAVY, PURPLE]),
    Spacer(1, 9),
    table([
        ["API-owned module", "Responsibility", "External/internal dependency"],
        ["Authentication", "Registration, login, RS256 verification, refresh rotation, logout", "PostgreSQL only"],
        ["Profiles and analyses", "Owner skills, snapshots, history, evidence, idempotency", "PostgreSQL and Skill Engine"],
        ["Projects and private CV", "Owner CRUD, PDF validation, private storage metadata", "PostgreSQL and private volume"],
        ["JobsProvider", "Fixture/live search, detail, normalization, encrypted cursor, rate/timeout mapping", "JSearch from API only"],
        ["Learning paths", "Deterministic generation, steps, progress, deleted-project snapshot", "PostgreSQL and curated catalog"],
    ], [1.45*inch, 3.15*inch, 1.9*inch]),
    p("6. Failure behavior and recovery", "H1X"),
    table([
        ["Failure", "Verified behavior", "Recovery / data guarantee"],
        ["Invalid/expired access JWT", "401 UNAUTHENTICATED; no protected handler runs", "Browser may attempt one refresh and retry"],
        ["PostgreSQL unavailable", "Readiness and stateful operations fail; internal details are not returned", "503-style structured response; no fabricated success"],
        ["Skill Engine unavailable/slow", "Analysis returns 503 or 504; draft and idempotency key remain", "No analysis row persisted; safe retry creates once"],
        ["JSearch 429/timeout/invalid JSON", "Mapped to bounded 429/504/503 responses without key leakage", "No hidden retry and no live-to-fixture substitution"],
        ["Project deleted", "Linked learning step keeps the stored activity snapshot and removes broken relation", "Learning path remains readable"],
    ], [1.45*inch, 3.0*inch, 2.05*inch]),
    p("Error responses contain code, safe message, requestId, and optional field errors. Unexpected server errors are logged with request context, while the client receives a generic INTERNAL_ERROR without stack traces, SQL, filesystem paths, tokens, or provider credentials."),
    p("Compose and runtime isolation", "H2X"),
    p("Docker Compose publishes only the web/proxy entry point. PostgreSQL, API, and Skill Engine remain on private networks as configured; the engine internal route is not exposed through the public proxy. The API container runs as a non-root identity aligned with the read-only private-key owner. PostgreSQL 16 runtime probes cover startup, proxy, registration, analysis, persistence after restart, M2/M4 persistence, and engine recovery."),
    PageBreak(),
]

# Page 5
story += [
    p("7. Applied security controls", "H1X"),
    table([
        ["Risk", "Implemented control", "Repository evidence"],
        ["Credential compromise", "Argon2id; dummy verification path; refresh hashes only", "auth-service.ts and auth repository integration tests"],
        ["Token forgery/replay", "RS256 with issuer/audience/typ checks; 15-minute access; single-use refresh families", "auth-service.ts and auth tests"],
        ["Broken access control", "Owner from verified JWT subject; owner-filtered SQL; foreign resources return 404", "projects, CV, analyses, and learning-path repositories/tests"],
        ["Injection and XSS", "Zod validation, parameterized pg queries, HTML rendered as text, safe external links", "API/web unit tests and Chromium E2E"],
        ["Secret exposure", "Ignored local env/keys; backend-only provider key; sanitized error bodies and CI artifacts", ".gitignore, setup-local.mjs, provider and error-handler tests"],
        ["External dependency abuse", "Fixed JSearch origin, timeout/size bounds, explicit live gate, no 429 retry", "provider.ts and controlled HTTP integration tests"],
    ], [1.25*inch, 3.1*inch, 2.15*inch]),
    p("8. Evidence and reproducibility", "H1X"),
    table([
        ["Artifact", "Verified purpose"],
        ["packages/contracts/openapi/*.yaml", "Public, M2, jobs, learning, and engine interfaces with examples and error responses"],
        ["apps/api/requests/e3-jsearch.http", "Reproducible E3 public requests without embedding credentials"],
        ["docs/acceptance/M3-results.md", "Separates fixture tests from the bounded real JSearch verification"],
        ["tests/e2e/*.spec.ts", "Chromium journeys with real API, Skill Engine, and isolated PostgreSQL"],
        ["docs/acceptance/probes/ops-compose.mjs", "Compose startup, persistence, recovery, and proxy runtime checks"],
        ["GitHub Actions", "Lint, format, typecheck, build, tests, PostgreSQL 16 E2E, docs, and Compose"],
    ], [2.4*inch, 4.1*inch]),
    p("Verified conclusion", "H1X"),
    p("DevPath implements authentication inside the main Express API and uses the Skill Engine as its independent microservice. The system has more than three REST operations, consistent JSON errors, isolated owner data, versioned contracts, and automated success/error coverage. JSearch live access was verified separately and remains disabled by default to prevent accidental quota use. This report intentionally does not claim a separate authentication microservice, browser access to secrets, silent provider fallback, or routes absent from the repository.", "Callout"),
    p("Audit basis: DevPath v0.4.0 release commit cacec37bba40528cfc091888bd2a33290b414940 and synchronized develop commit bc104f044a65f5102cbf0c8fb46c8c37649e58f9. Generated from repository source by scripts/generate-auth-report.py."),
]

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
ReportDoc(str(OUTPUT)).build(story)
print(f"Wrote {OUTPUT}")
