"""Purelymail access; credentials and staff assignments stay on the server."""
from contextlib import contextmanager
from email import policy
from email.parser import BytesParser
from email.utils import parseaddr
from html.parser import HTMLParser
import imaplib
import json
import os
import ssl

from fastapi import HTTPException


def mailbox_for(staff):
    try:
        settings = json.loads(os.getenv("PURELYMAIL_MAILBOXES_JSON", "{}"))
        box = settings.get(str(staff.id))
        if box is None:
            raise HTTPException(409, "Your inbox has not been connected yet.")
        address = box["address"]
        password = os.getenv(box["password_env"], "")
        if not password or "@" not in address or parseaddr(address)[1] != address or "\n" in address or "\r" in address:
            raise ValueError("Invalid mailbox configuration")
        return {"address": address, "password": password}
    except (ValueError, KeyError, TypeError, AttributeError):
        raise HTTPException(503, "Your inbox connection needs administrator setup.") from None


@contextmanager
def connect(box):
    client = None
    try:
        client = imaplib.IMAP4_SSL("imap.purelymail.com", 993, ssl_context=ssl.create_default_context(), timeout=10)
        client.login(box["address"], box["password"])
        result, _ = client.select("INBOX", readonly=True)
        if result != "OK":
            raise imaplib.IMAP4.error("Cannot open inbox")
        yield client
    except (imaplib.IMAP4.error, OSError, EOFError):
        raise HTTPException(502, "Purelymail could not be reached. Please try again.") from None
    finally:
        if client is not None:
            try:
                client.logout()
            except (imaplib.IMAP4.error, OSError, EOFError):
                pass


def validity(client):
    _, values = client.response("UIDVALIDITY")
    if not values or not values[0]:
        raise HTTPException(502, "Purelymail did not return an inbox identifier.")
    return int(values[0])


def raw_message(client, uid, fields):
    status, data = client.uid("fetch", str(uid), fields)
    if status != "OK":
        raise HTTPException(502, "The message could not be loaded.")
    for item in data or []:
        if isinstance(item, tuple) and isinstance(item[1], bytes):
            return item[0], item[1]
    raise HTTPException(404, "This message is no longer in your inbox.")


def headers(message):
    return {"subject": str(message.get("Subject", "(No subject)")),
            "sender": str(message.get("From", "")), "to": str(message.get("To", "")),
            "reply_to": parseaddr(str(message.get("Reply-To", message.get("From", ""))))[1],
            "date": str(message.get("Date", ""))}


def inbox(box, before=None):
    with connect(box) as client:
        uid_validity = validity(client)
        if before == 1:
            return {"address": box["address"], "uid_validity": uid_validity, "messages": [], "next_before": None}
        criteria = "ALL" if before is None else f"UID 1:{before - 1}"
        status, values = client.uid("search", None, criteria)
        if status != "OK":
            raise HTTPException(502, "Your inbox could not be loaded.")
        uids = sorted((int(value) for value in (values[0] or b"").split()), reverse=True)
        messages = []
        for uid in uids[:20]:
            try:
                meta, raw = raw_message(client, uid, "(FLAGS BODY.PEEK[HEADER.FIELDS (SUBJECT FROM TO REPLY-TO DATE)])")
            except HTTPException as error:
                if error.status_code == 404:
                    continue
                raise
            message = BytesParser(policy=policy.default).parsebytes(raw)
            messages.append({"uid": uid, "unread": b"\\Seen" not in meta, **headers(message)})
        return {"address": box["address"], "uid_validity": uid_validity, "messages": messages,
                "next_before": uids[19] if len(uids) > 20 else None}


class PlainHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.blocked = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.blocked += 1
        elif tag in {"br", "p", "div", "li"} and not self.blocked:
            self.text.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style"} and self.blocked:
            self.blocked -= 1

    def handle_data(self, data):
        if not self.blocked:
            self.text.append(data)


def read_message(box, uid, uid_validity):
    with connect(box) as client:
        if validity(client) != uid_validity:
            raise HTTPException(409, "Your inbox changed. Refresh it before opening this message.")
        _, raw = raw_message(client, uid, "(BODY.PEEK[]<0.2097152>)")
        message = BytesParser(policy=policy.default).parsebytes(raw)
        part = message.get_body(preferencelist=("plain", "html"))
        try:
            body = part.get_content() if part else ""
        except (LookupError, UnicodeError):
            body = (part.get_payload(decode=True) or b"").decode("utf-8", errors="replace") if part else ""
        if part and part.get_content_type() == "text/html":
            parser = PlainHTML()
            parser.feed(body)
            body = "".join(parser.text)
        return {"uid": uid, **headers(message), "body": body,
                "truncated": len(raw) >= 2097152,
                "attachments": [str(p.get_filename() or "Attachment") for p in message.iter_attachments()]}
