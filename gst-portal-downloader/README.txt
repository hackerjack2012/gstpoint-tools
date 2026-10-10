GST Portal Downloader - by Rahul Pal | v0.2.6 TEST VERSION

INSTALL
1. Extract this ZIP into a permanent folder.
2. Open chrome://extensions in Chrome.
3. Enable Developer mode (top right).
4. Click Load unpacked and select the folder containing manifest.json.
5. Log in to GST, open Services > User Services > My Applications.
6. Refresh the page after installing the extension.
7. Open the extension, select application types and dates, then Start new run.

FIRST TEST
Use one month containing one or two applications. Compare downloaded files
against the portal tabs manually before running several years.
If Chrome asks to allow multiple downloads, allow them for the GST portal.
Turn OFF 'Ask where to save each file before downloading' in Chrome download
settings if Save As prompts interrupt the run.
Keep the GST tab open and avoid manually navigating it during automation.
Do not run other GST downloads at the same time: generated downloads may not
expose a reliable originating-tab identifier.

SCOPE
DRC-03: Applications downloadable files; ACK./INTIMATION excluded.
Refunds: visible case categories, generated form, ARN download and attachments.
Search intervals are single calendar months (partial months at range boundaries).
Dates are search/filing dates, not refund claim periods.

FOLDERS (inside the Chrome download location)
GST_Portal/GSTIN/DRC_03_September_2026/ARN/APPLICATIONS/files
GST_Portal/GSTIN/Refund_September_2026/ARN/document-category/files
Filing date determines month/year. Chrome creates folders when files download.
Original filename is retained with a document label prefix. Name clashes get
unique suffixes. Category labels may vary by case.

PROGRESS
Pause lets an already-started download finish. Resume retries the current month,
skips completed ARNs and completed document keys, and continues.
Start new run resets the saved completion history; it may download copies again.
Stop retains progress. Only one saved run is kept. Export log saves local metadata.
Download failure pauses the run; check Chrome Downloads and the GST page before
resuming. If a delayed file arrives after a timeout it may use its original name;
check the download folder before retrying.

LIMITATIONS
Not live-tested on the GST portal. HTML supplied by the user informs selectors.
Date updates use Angular field controllers where available, native input/change
events otherwise, and synchronize attached jQuery datepickers. No Angular debug
scope lookup is required. Live testing must verify the resulting search dates.
Some document categories may have different controls not yet supplied.
Pagination detects common ng-table Next controls; other layouts need adaptation.
Rendering completion uses portal overlays and short waits; a slow portal may
require adjustments. Compare first-test counts before treating a run as complete.
Application Form and ARN links may yield duplicate representations; retained
rather than guessing which one to omit.
Browser restart during a download can require inspecting Chrome Downloads and
resuming after clearing the pending operation by reloading the extension.
Login credentials are held only in Chrome browser-session memory, cleared after
login/Stop, and never included in exported logs. Existing CAPTCHA solver provides
the six digits; this package has no built-in inference runtime. OTP needs manual
completion. No external server.
Only local progress/log metadata is stored by the extension.

TROUBLESHOOT
Send the exact status message, the step where it stopped, and Export log.
Logs include GSTINs, ARNs and filenames: review before sharing.

0.1.2: Temporary GSTIN absence during page transitions no longer means logout.
Explicit login/session-expiry indicators pause; a different visible GSTIN pauses.

0.1.3: Wait for dropdown options; select via native change event; avoid model render resetting fields.

0.1.4: Persist active ARN before navigation and continue downloads on the case
folder page after a full page load. Navigation-loop guard and page/ARN logs added.

0.1.5: Single active page runner; adopt matching pending downloads after navigation.
Completed/interrupted/expired pending trackers no longer permanently block a run.

0.1.6: Refund ARN folders include Inverted/Export and claim period, for example
AA030926045183B_Export_Aug_26. Windows forbids *, so separators are underscores.
Multi-month periods use Aug_26_to_Sep_26. Outer monthly folder still uses filing
date; inner ARN folder uses the refund claim period shown in the results.

0.2.0 LOGIN MODE
Keep your already-working GST CAPTCHA solver extension enabled.
The supplied model.zip contains only an ONNX model, not its preprocessing/runtime;
this package deliberately does not start a second CAPTCHA solver.
Open the downloader popup on any page, enable Login and navigate automatically,
enter username/password, choose reports/dates and Start new run.
A new GST login tab opens. Credentials are filled, then the extension waits up to
60 seconds for the existing solver (or you) to enter a six-digit CAPTCHA.
It submits login ONCE. Invalid credentials/CAPTCHA pauses instead of repeated
login attempts. OTP pauses for manual completion. Resume after completing OTP.
If credentials need changing, Stop then start again from the popup.
Escape is sent to close post-login popups. Synthetic Escape may be ignored by
some modals; if a modal remains, close it manually then Resume.
The extension opens User Services and My Applications, then binds the detected
GSTIN to the run before downloading. If the login URL redirects to an existing session, it logs out first before
using the supplied credentials. Logout affects other GST tabs sharing that
Chrome profile. If no Logout control is found, it pauses for manual logout.
Only the active run tab may execute the workflow. Existing solver extension code
is isolated from downloader code; the downloader never writes the CAPTCHA field.
Login fields are matched by common GST IDs; portal changes can require updates.
Full end-to-end login/download flow remains unverified on the live portal.

0.2.1: Require fresh login for automatic-login runs. Existing authenticated
sessions cannot proceed to downloads before logout and new credential submission.

0.2.2: Password field no longer clears after Start. Start errors remain visible
instead of being replaced by old status polling. Accepted new runs reset logs.
Pause/Stop work from the popup even if the GST page script is unavailable.
Optional Remember username and password stores both in Chrome local extension
storage WITHOUT ENCRYPTION. Uncheck Remember to delete the saved credentials.
Browser-session credentials are still cleared after login/Stop. Remembered
credentials persist until Remember is unchecked or the extension is removed.
Export log contains run metadata only, not remembered or session credentials.
An active run must be stopped before Start new run; its logs remain until a new
run is accepted. Updating with Reload preserves extension identity/preferences;
removing and re-installing deletes saved preferences and progress.

0.2.3: Sync credentials into Angular ngModel and commit/validate them, with
input/change/keyup/blur notifications for custom field handlers.

0.2.4: Refill credentials after CAPTCHA is ready; mark Angular fields touched;
move focus to CAPTCHA, check password validity, submit through requestSubmit.
Logs record model-presence/validity only, never password contents.

0.2.5: Synchronize the input ng-model expression through its Angular controller
scope after custom blur handlers, then digest and validate before submission.

0.2.6: Credential entry and Login click use Chrome native input controls via
the debugger API, rather than DOM assignments/model writes. This requires the
debugger permission. Chrome displays a debugging banner during native typing
and clicking. Close DevTools for the run tab before starting. The extension
attaches only for these login actions and detaches immediately afterward.
Do not cancel the debugging banner while credentials are being entered.
