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


def test_html_email_preserves_layout_and_removes_active_content():
    from backend.services.email_html import sanitize_email_html
    result = sanitize_email_html('<table><tr><td style="color: red; padding: 12px; background-image:url(https://tracker.example)">Hello <b>Kat</b></td></tr></table><script>alert(1)</script><img src="https://example.com/logo.png" onerror="alert(1)"><a href="javascript:alert(1)">Bad link</a><iframe src="https://example.com"></iframe>')
    assert '<table>' in result and '<b>Kat</b>' in result
    assert 'padding: 12px' in result
    assert '<script' not in result and 'onerror' not in result
    assert 'javascript:' not in result and '<iframe' not in result
    assert 'background-image' not in result


def test_embedded_images_render_but_executable_data_links_do_not():
    from email.message import EmailMessage
    from backend.services.email_html import sanitize_email_html, embed_email_images
    message = EmailMessage()
    message.set_content('Hello')
    message.add_alternative('<img src="cid:logo">', subtype='html')
    message.get_payload()[1].add_related(b'png-bytes', maintype='image', subtype='png', cid='<logo>')
    result = sanitize_email_html(embed_email_images('<img src="cid:logo"><a href="data:text/html,bad">Bad</a><img src="data:image/svg+xml,bad">', message))
    assert 'data:image/png;base64,' in result
    assert 'data:text/html' not in result and 'data:image/svg' not in result



def test_opened_email_can_be_marked_read_on_server():
    client = MagicMock()
    client.select.return_value = ('OK', [b'1'])
    client.response.return_value = ('UIDVALIDITY', [b'8'])
    client.uid.side_effect = [('OK', [(b'1', b'Message-ID: <test>\r\n\r\n')]), ('OK', [])]
    with patch.object(mail.imaplib, 'IMAP4_SSL', return_value=client):
        result = mail.mark_message_read({'address': 'kat@example.com', 'password': 'test'}, 1, 8)
    client.select.assert_called_once_with('INBOX', readonly=False)
    assert client.uid.call_args.args == ('store', '1', '+FLAGS.SILENT', '(\\Seen)')
    assert result['unread'] is False


def test_mark_read_uses_authenticated_mailbox(environment):
    _, client = environment
    with patch('backend.api.mail.mark_message_read', return_value={'uid': 5, 'unread': False}) as mark:
        response = client.post('/mail/inbox/5/read?uid_validity=7&view=unread&staff_id=3')
    assert response.status_code == 200
    assert mark.call_args.args[0]['address'] == 'kat@example.com'
    assert mark.call_args.kwargs['view'] == 'unread'



def test_search_uses_literal_unicode_text_without_imap_injection():
    client = MagicMock()
    client.select.return_value = ('OK', [b'100'])
    client.response.return_value = ('UIDVALIDITY', [b'7'])
    client.status.return_value = ('OK', [b'INBOX (MESSAGES 100 UNSEEN 35)'])
    client.uid.return_value = ('OK', [b''])
    term = 'café ") ALL'
    with patch.object(mail.imaplib, 'IMAP4_SSL', return_value=client):
        mail.inbox({'address': 'kat@example.com', 'password': 'test'}, view='unread', search=term)
    assert client.literal == term.encode('utf-8')
    client.uid.assert_called_once_with('search', 'CHARSET', 'UTF-8', 'UNSEEN TEXT')


def test_reply_headers_are_derived_from_own_original_message():
    smtp = MagicMock()
    smtp.__enter__.return_value = smtp
    client = MagicMock()
    client.response.return_value = ('UIDVALIDITY', [b'7'])
    client.append.return_value = ('OK', [])
    client.uid.return_value = ('OK', [(b'1', b'Message-ID: <parent@example.com>\r\nReferences: <root@example.com>\r\n\r\n')])
    from contextlib import contextmanager
    @contextmanager
    def connect(*args, **kwargs): yield client
    with patch.object(mail, 'connect', connect), patch.object(mail.smtplib, 'SMTP_SSL', return_value=smtp):
        mail.send_message({'address': 'kat@example.com', 'password': 'test'}, 'recipient@example.com', 'Re: Hello', 'Reply', reply={'uid':1,'uid_validity':7,'view':'inbox'})
    message = smtp.send_message.call_args.args[0]
    assert message['In-Reply-To'] == '<parent@example.com>'
    assert str(message['References']) == '<root@example.com> <parent@example.com>'


def test_conversation_groups_inbox_and_sent_by_message_ids():
    client = MagicMock()
    client.select.return_value = ('OK', [b'1'])
    client.response.return_value = ('UIDVALIDITY', [b'7'])
    source = b'Message-ID: <root@example.com>\r\nSubject: Hello\r\nDate: Tue, 13 Oct 2026 10:00:00 +0200\r\n\r\n'
    reply = b'Message-ID: <reply@example.com>\r\nReferences: <root@example.com>\r\nSubject: Re: Hello\r\nDate: Tue, 13 Oct 2026 11:00:00 +0200\r\n\r\n'
    client.uid.side_effect = [('OK',[(b'1',source)]),('OK',[b'1']),('OK',[(b'1',source)]),('OK',[b'2']),('OK',[(b'2',reply)])]
    with patch.object(mail.imaplib, 'IMAP4_SSL', return_value=client):
        result = mail.conversation({'address': 'kat@example.com', 'password': 'test'}, 1, 7)
    assert [item['view'] for item in result['messages']] == ['inbox','sent']
    assert [item['subject'] for item in result['messages']] == ['Hello','Re: Hello']



def test_stdlib_uid_search_includes_charset_keyword():
    # Exercise the real stdlib UID method: unlike search(), it does not insert CHARSET.
    from contextlib import contextmanager
    client = object.__new__(mail.imaplib.IMAP4)
    client.state = 'SELECTED'
    client._simple_command = MagicMock(return_value=('OK', []))
    client._untagged_response = MagicMock(return_value=('OK', [b'']))
    client.response = MagicMock(return_value=('UIDVALIDITY', [b'7']))
    client.status = MagicMock(return_value=('OK', [b'INBOX (MESSAGES 5 UNSEEN 2)']))
    @contextmanager
    def connect(*args, **kwargs): yield client
    with patch.object(mail, 'connect', connect):
        mail.inbox({'address':'kat@example.com','password':'test'}, search='customer')
    client._simple_command.assert_called_once_with('UID','SEARCH','CHARSET','UTF-8','ALL TEXT')
    assert client.literal == b'customer'
