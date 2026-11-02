# Purelymail inbox setup

The dashboard uses encrypted IMAP access to `imap.purelymail.com:993`.
Existing Brevo notifications and client follow-ups remain unchanged.
The inbox screen includes full inbox/unread counts, reading, composing, and replies.
Personal mail is sent through smtp.purelymail.com:465 with the same mailbox credentials.
A copy is appended to the Sent folder when available; an archive failure does not
report a delivered message as failed or retry sending it.

Configure these variables in the backend environment (locally in `backend/.env`
and in production's server environment). Never use `NEXT_PUBLIC_` for mail credentials.

```text
PURELYMAIL_MAILBOXES_JSON={"STAFF_ID":{"address":"user@your-domain.example","password_env":"PURELYMAIL_USER_PASSWORD"}}
PURELYMAIL_USER_PASSWORD=<Purelymail app password>
PURELYMAIL_INFO_PASSWORD=<Purelymail app password for info@oatle-technologies.co.za>
```

Replace `STAFF_ID` with the actual numeric ID from the staff table. Add an
entry and a distinct password variable for each user's mailbox. Use the full
mailbox address as the login. App passwords are required when Purelymail 2FA is enabled.
Do not commit passwords or place them in chat.

Invoice emails are sent by the authenticated backend through
`smtp.purelymail.com:465` as `info@oatle-technologies.co.za`. Configure
`PURELYMAIL_INFO_PASSWORD` in the backend environment (including production);
it is never sent to or exposed in the browser. Invoice delivery uses the saved
invoice and client records, preserves the existing invoice email design, and
marks the email delivered only after Purelymail accepts the message. It then
attempts to append a copy to the Sent folder; an IMAP archive failure is logged
without retrying SMTP or undoing the recorded delivery. Only draft invoices
change to `sent`; paid, cancelled, overdue, and already-sent statuses are
preserved when sending or resending.

The invoice HTML template contains no private banking data. Configure these
values only in the backend environment so the existing banking-details section
can be populated at send time:

```text
INVOICE_BANK_NAME=<bank name>
INVOICE_BANK_ACCOUNT_HOLDER=<account holder>
INVOICE_BANK_ACCOUNT_NUMBER=<account number>
INVOICE_BANK_ACCOUNT_TYPE=<account type>
INVOICE_BANK_BRANCH_CODE=<branch code>
```

All five values are required. Before deploying this code, apply
`sql/006_invoice_email_sent_at.sql` using
`scripts/migrate_invoice_email_sent_at.py --apply` in the deployment
environment. This additive marker protects prior sent and otherwise
non-draft invoices from accidental duplicate sends; a resend requires an
explicit confirmation.

Every request resolves the mailbox from the authenticated staff ID. Administrator
status does not grant access to other inboxes. No browser request accepts a mailbox
address or staff ID. An unconfigured user receives a setup message.

Inbox reading is read-only: it does not mark messages as read, delete mail,
or change server folders. Messages are displayed as text, without loading remote
images or running email HTML. Attachments are listed but not downloaded.
The list returns 20 messages at a time; message bodies are limited to 2 MiB.

Open `/dashboard/inbox` after signing in. Verify with two real test users that
each sees only their own mailbox before deploying. Check outbound IMAP connectivity
from the deployment runtime. SMTP sending already exists separately.

## Verified Oatle mappings

| Staff ID | User | Mailbox | Server password variable |
| --- | --- | --- | --- |
| 6 | Vinolia | info@oatle-technologies.co.za | PURELYMAIL_INFO_PASSWORD |
| 7 | Kat | communications@oatle-technologies.co.za | PURELYMAIL_COMMUNICATIONS_PASSWORD |
| 9 | Colin | dev@oatle-technologies.co.za | PURELYMAIL_DEV_PASSWORD |

The mailbox map is configured locally; the three password variables still need
actual Purelymail app passwords. Production also needs the mailbox map and
password variables. No passwords are included in this document.
