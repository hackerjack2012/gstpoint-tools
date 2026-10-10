# GST Portal Downloader — v0.3.1

## Install / update
Extract this ZIP into a permanent folder. Open chrome://extensions, enable Developer mode, and load the extracted folder with Load unpacked. To update an existing installation, replace its files and click Reload. Refresh the GST portal tab after reloading. Stop an old run before updating; start a new run after upgrading.

## Scope
DRC-03: downloadable Application files only; ACK./INTIMATION excluded.
Refunds: downloadable forms and attachments across the available application, notice/acknowledgement, replies/request and orders categories. No additional portal modules were added.

## Start a run
Enter GST username/password, choose dates and application types, then Start new run. Searches use calendar-month windows. A new run replaces the previous run and starts with an empty activity log and ledger; the incremental download archive is retained. Auto login opens a GST tab, logs out an existing account, fills credentials with Chrome native input, waits for your existing CAPTCHA extension, and submits Login. Keep DevTools closed during login. OTP, remaining dialogs, and login errors pause the run for your attention. Escape is attempted for post-login dialogs.

Keep the GST run tab open. Avoid other GST downloads during a run. Chrome download preferences are unchanged: an enabled Ask where to save setting may still display prompts. Login uses your existing CAPTCHA solver; this package does not contain or run a second ONNX solver.

## Client queue
Use Add client for each account in the desired order. When a queue exists, it is used instead of the current login fields. Username/password and queue drafts are retained only in browser-session storage so opening Keep open or reopening the popup does not lose entered details. They are not remembered across browser restarts. The encrypted vault and manual trade-name/GSTIN fields have been removed; old saved vault data is deleted when the panel opens.

## Files and folders
Files are placed below Chrome's download directory:

GST_Portal/<GSTIN>_<TradeName>/DRC_03_<Month>_<Year>/...
GST_Portal/<GSTIN>_<TradeName>/Refund_<Month>_<Year>/<ARN>_Inverted_Aug_26/...
GST_Portal/<GSTIN>_<TradeName>/Refund_<Month>_<Year>/<ARN>_Export_Aug_26/...

Monthly folders use the application's filing date. Refund ARN folder suffixes use the refund claim period. Multi-month claim periods include both endpoints. Unsupported filename characters are replaced with underscores. Trade name is detected automatically. If unavailable, the taxpayer folder falls back to GSTIN so downloads can continue. Open folder reveals a downloaded file or opens Chrome's default download folder.

## Progress and reconciliation
Keep open opens the persistent Chrome side panel. It shows elapsed time, client position, discovered ARNs/documents, downloaded/already-saved/failed totals, incomplete ARNs, and empty categories. Pause, Resume, and Stop retain the ledger. The progress bar measures discovered files and can expand as more files are found; it is not a total portal-record estimate.

Export Excel produces an XLSX workbook with Documents, Cases, and Summary sheets. It includes GSTIN, trade name, ARN, document category/status, filing date, refund period, attempts, filename/path and errors. Export JSON log gives detailed diagnostics without passwords. Files and account identifiers in exports remain sensitive client information.

## Incremental downloads and retries
Incremental mode revisits ARNs to discover new documents and skips previously completed files only when Chrome still reports the tracked download as present. Clearing Chrome's download history or removing files may cause them to download again. Detection uses portal document/category labels, not file-content hashes; a renamed portal document may be downloaded as new.

Automatic retry is bounded by the configured count and applies to interrupted/network failures. A download that never starts is recorded as failed rather than repeatedly clicked. Retry failed only revisits incomplete/failed ARNs. With a client queue it starts a fresh login sequence for those queued clients, skipping unrelated ARNs; without a queue it prepares a retry on the existing GST tab—ensure the original account is logged in and press Resume. Cases still missing from search results remain incomplete.

Empty categories are reported explicitly. No downloadable controls for an ARN is flagged for review. A completed run confirms observed controls were processed; it does not certify the portal contains no other documents.

## Permissions
Storage: preferences, encrypted vault, ledger and archive. Downloads: track and name GST files and reveal folders. Scripting and GST host access: interact with portal controls. Debugger: native login input and mouse click, detached after each action. Side panel: persistent progress view. No credentials are sent to an external server by this extension.
