# Purelymail inbox setup

The dashboard uses encrypted IMAP access to `imap.purelymail.com:993`.
Existing Brevo sending remains unchanged. This change adds reading inboxes;
it does not add a new email composer or change outgoing delivery.

Configure these variables in the backend environment (locally in `backend/.env`
and in production's server environment). Never use `NEXT_PUBLIC_` for mail credentials.

```text
PURELYMAIL_MAILBOXES_JSON={"STAFF_ID":{"address":"user@your-domain.example","password_env":"PURELYMAIL_USER_PASSWORD"}}
PURELYMAIL_USER_PASSWORD=<Purelymail app password>
```

Replace `STAFF_ID` with the actual numeric ID from the staff table. Add an
entry and a distinct password variable for each user's mailbox. Use the full
mailbox address as the login. App passwords are required when Purelymail 2FA is enabled.
Do not commit passwords or place them in chat.

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
