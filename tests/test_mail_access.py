import json
from types import SimpleNamespace
from unittest.mock import patch, MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from backend.api.mail import router
from backend.dependencies import get_current_staff
from backend.services import mailbox_service as mail


@pytest.fixture
def environment():
    identity = SimpleNamespace(id=2, access_level="member")
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_staff] = lambda: identity
    with patch.dict("os.environ", {
        "PURELYMAIL_MAILBOXES_JSON": json.dumps({
            "2": {"address": "kat@example.com", "password_env": "TEST_KAT_MAIL_PASSWORD"},
            "3": {"address": "colin@example.com", "password_env": "TEST_COLIN_MAIL_PASSWORD"}}),
        "TEST_KAT_MAIL_PASSWORD": "test-kat", "TEST_COLIN_MAIL_PASSWORD": "test-colin"}), TestClient(app) as client:
        yield identity, client


def test_each_member_resolves_only_own_mailbox(environment):
    identity, client = environment
    with patch("backend.api.mail.inbox", return_value={"messages": []}) as inbox:
        for role in ("member", "admin"):
            for person, address in ((2, "kat@example.com"), (3, "colin@example.com")):
                identity.id, identity.access_level = person, role
                response = client.get("/mail/inbox?staff_id=999&address=other@example.com")
                assert response.status_code == 200
                assert inbox.call_args.args[0]["address"] == address
                assert "password" not in response.text
                assert response.headers["cache-control"] == "no-store"


def test_unconfigured_admin_cannot_access_another_mailbox(environment):
    identity, client = environment
    identity.id, identity.access_level = 1, "admin"
    with patch("backend.api.mail.inbox") as inbox:
        assert client.get("/mail/inbox").status_code == 409
        inbox.assert_not_called()


def test_message_lookup_also_uses_own_mailbox(environment):
    _, client = environment
    with patch("backend.api.mail.read_message", return_value={"body": "Message"}) as read:
        assert client.get("/mail/inbox/15?uid_validity=7").status_code == 200
        assert read.call_args.args == ({"address": "kat@example.com", "password": "test-kat"}, 15, 7)


def test_imap_read_is_readonly_and_does_not_mark_seen():
    client = MagicMock()
    client.select.return_value = ("OK", [b"1"])
    client.response.return_value = ("UIDVALIDITY", [b"7"])
    client.uid.return_value = ("OK", [(b"1", b"Subject: Hello\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<p>Hello</p><script>bad()</script><img src='https://tracker.example/pixel'>")])
    with patch.object(mail.imaplib, "IMAP4_SSL", return_value=client):
        result = mail.read_message({"address": "kat@example.com", "password": "test"}, 1, 7)
    client.select.assert_called_once_with("INBOX", readonly=True)
    client.uid.assert_called_once_with("fetch", "1", "(BODY.PEEK[]<0.2097152>)")
    assert result["body"].strip() == "Hello"
    client.logout.assert_called_once()


def test_uid_validity_change_prevents_wrong_message():
    client = MagicMock()
    client.select.return_value = ("OK", [b"1"])
    client.response.return_value = ("UIDVALIDITY", [b"8"])
    with patch.object(mail.imaplib, "IMAP4_SSL", return_value=client), pytest.raises(Exception) as error:
        mail.read_message({"address": "kat@example.com", "password": "test"}, 1, 7)
    assert error.value.status_code == 409
    client.uid.assert_not_called()


def test_mail_requires_authentication():
    app = FastAPI()
    app.include_router(router)
    with TestClient(app) as client:
        assert client.get("/mail/inbox").status_code == 401


def test_counts_cover_entire_inbox_not_only_page():
    client = MagicMock()
    client.select.return_value = ('OK', [b'100'])
    client.response.return_value = ('UIDVALIDITY', [b'7'])
    client.status.return_value = ('OK', [b'INBOX (MESSAGES 100 UNSEEN 35)'])
    client.uid.side_effect = [('OK', [b'1 2']), ('OK', [(b'2 (FLAGS ())', b'Subject: New\r\n\r\n')]), ('OK', [(b'1 (FLAGS (\\Seen))', b'Subject: Read\r\n\r\n')])]
    with patch.object(mail.imaplib, 'IMAP4_SSL', return_value=client):
        result = mail.inbox({'address': 'kat@example.com', 'password': 'test'})
    assert result['total'] == 100 and result['unread'] == 35
    assert [m['unread'] for m in result['messages']] == [True, False]


def test_send_cannot_spoof_sender(environment):
    _, client = environment
    payload = {'recipient': 'recipient@example.com', 'subject': 'Hello', 'body': 'Hello'}
    with patch('backend.api.mail.send_message', return_value={'sent': True, 'sent_copy_saved': True}) as send:
        assert client.post('/mail/send', json={**payload, 'from': 'colin@example.com'}).status_code == 422
        send.assert_not_called()
        assert client.post('/mail/send', json=payload).status_code == 200
        assert send.call_args.args[0]['address'] == 'kat@example.com'
        assert client.post('/mail/send', json={**payload, 'subject': 'Hello\r\nBcc: thief@example.com'}).status_code == 422


def test_successful_delivery_is_not_retried_on_sent_folder_failure():
    smtp = MagicMock()
    smtp.__enter__.return_value = smtp
    from fastapi import HTTPException
    with patch.object(mail.smtplib, 'SMTP_SSL', return_value=smtp), patch.object(mail, 'connect', side_effect=HTTPException(502, 'Archive unavailable')):
        result = mail.send_message({'address': 'kat@example.com', 'password': 'test'}, 'recipient@example.com', 'Hello', 'Body')
    assert result == {'sent': True, 'sent_copy_saved': False}
    smtp.send_message.assert_called_once()
    assert smtp.send_message.call_args.kwargs['from_addr'] == 'kat@example.com'


def test_inbox_email_uses_branded_template_and_safe_content():
    smtp = MagicMock()
    smtp.__enter__.return_value = smtp
    from fastapi import HTTPException
    with patch.object(mail.smtplib, 'SMTP_SSL', return_value=smtp), patch.object(mail, 'connect', side_effect=HTTPException(502, 'Archive unavailable')):
        mail.send_message({'address': 'dev@example.com', 'password': 'test'}, 'recipient@example.com', 'Subject <unsafe>', '<script>bad()</script>\nSecond line')
    message = smtp.send_message.call_args.args[0]
    html = message.get_body(preferencelist=('html',)).get_content()
    assert 'Oatle Technologies' in html
    assert '#d4af37' in html and 'oatle-technologies-transparent-logo.png' in html
    assert '&lt;script&gt;' in html and '<script>bad()</script>' not in html
    assert 'dev@example.com' in html
    assert message.get_body(preferencelist=('plain',)).get_content().strip() == '<script>bad()</script>\nSecond line'


@pytest.mark.parametrize('view,folder,criteria', [('inbox','INBOX','ALL UID 1:49'), ('unread','INBOX','UNSEEN UID 1:49'), ('sent','Sent','ALL UID 1:49')])
def test_views_select_correct_folder_and_filter_entire_mailbox(view, folder, criteria):
    client = MagicMock()
    client.select.return_value = ('OK', [b'100'])
    client.response.return_value = ('UIDVALIDITY', [b'7'])
    client.status.return_value = ('OK', [b'INBOX (MESSAGES 100 UNSEEN 35)'])
    client.uid.return_value = ('OK', [b''])
    with patch.object(mail.imaplib, 'IMAP4_SSL', return_value=client):
        result = mail.inbox({'address': 'kat@example.com', 'password': 'test'}, 50, view=view)
    client.select.assert_called_once_with(folder, readonly=True)
    client.uid.assert_called_once_with('search', None, criteria)
    assert result['messages'] == []


def test_sent_message_reads_sent_folder():
    client = MagicMock()
    client.select.return_value = ('OK', [b'1'])
    client.response.return_value = ('UIDVALIDITY', [b'8'])
    client.uid.return_value = ('OK', [(b'1', b'Subject: Sent\r\n\r\nBody')])
    with patch.object(mail.imaplib, 'IMAP4_SSL', return_value=client):
        result = mail.read_message({'address': 'kat@example.com', 'password': 'test'}, 1, 8, view='sent')
    client.select.assert_called_once_with('Sent', readonly=True)
    assert result['subject'] == 'Sent'


def test_arbitrary_folder_cannot_be_selected(environment):
    _, client = environment
    assert client.get('/mail/inbox?view=other-user').status_code == 422
