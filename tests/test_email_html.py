from pathlib import Path
import pytest
from backend.services.email_html import sanitize_email_html

FIXTURE = Path(__file__).parent / "fixtures" / "incoming-document.html"


def test_full_document_does_not_display_head_title_or_stylesheet_text():
    result = sanitize_email_html(FIXTURE.read_text())
    assert "DOCUMENT_TITLE_ONLY" not in result
    assert "a:hover" not in result and 'font-family: "Roboto"' not in result
    assert "<h2>Confirm your account</h2>" in result
    assert "Hello &amp; welcome." in result
    assert '<a href="https://example.invalid/confirm/TEST-ONLY">Confirm account</a>' in result
    assert '<table width="600"' in result and 'padding:28px;' in result


@pytest.mark.parametrize("tag", ["head", "title", "style", "script", "template", "iframe", "object", "noscript"])
def test_non_display_subtrees_do_not_become_visible_text(tag):
    result = sanitize_email_html(f'<{tag}>HIDDEN_CONTENT</{tag}><p>Visible message</p>')
    assert "HIDDEN_CONTENT" not in result
    assert "<p>Visible message</p>" in result


def test_case_insensitive_metadata_and_omitted_head_end_preserve_body():
    result = sanitize_email_html('<HTML><HEAD><TITLE>PRIVATE_TITLE</TITLE><STYLE>a:hover {color:red}</STYLE><BODY><p>Visible</p></BODY></HTML>')
    assert "PRIVATE_TITLE" not in result and "a:hover" not in result
    assert "<p>Visible</p>" in result


def test_fragments_keep_inline_layout_links_entities_and_message_text():
    result = sanitize_email_html('<div style="padding:12px;color:#222">Keep &lt;title&gt; as text &amp; &#169;<br><strong>Bold</strong><a href="mailto:team@example.invalid">Email us</a></div>')
    assert 'padding:12px;' in result and '<strong>Bold</strong>' in result
    assert 'href="mailto:team@example.invalid"' in result
    assert "&lt;title&gt; as text &amp; &#169;" in result


def test_security_sanitizer_still_blocks_executable_markup_urls_and_css():
    result = sanitize_email_html('''<p onclick="bad()" style="padding:12px;background-image:url(https://tracker.example.invalid);position:fixed">Safe</p>
<script>SECRET_SCRIPT_TEXT</script><img src="https://example.invalid/logo.png" onerror="bad()">
<a href="javascript:bad()">Unsafe link</a><a href="data:text/html,bad">Unsafe data</a>
<img src="data:image/svg+xml,bad"><iframe src="https://example.invalid">HIDDEN_FRAME_TEXT</iframe>''')
    for blocked in ["onclick", "onerror", "javascript:", "data:text/html", "data:image/svg", "background-image", "position:", "SECRET_SCRIPT_TEXT", "HIDDEN_FRAME_TEXT", "<script", "<iframe"]:
        assert blocked not in result
    assert '<p style="padding:12px;">Safe</p>' in result
    assert 'src="https://example.invalid/logo.png"' in result
    assert "Unsafe link" in result


def test_self_closing_metadata_does_not_hide_following_body():
    result = sanitize_email_html('<title/><meta charset="utf-8"/><p>Visible</p>')
    assert "<p>Visible</p>" in result


def test_html_only_received_message_uses_cleaned_display_markup():
    from email.message import EmailMessage
    from unittest.mock import MagicMock, patch
    from backend.services import mailbox_service as mail
    message = EmailMessage()
    message["Subject"] = "Synthetic received email"
    message.set_content(FIXTURE.read_text(), subtype="html")
    client = MagicMock()
    client.select.return_value = ("OK", [b"1"])
    client.response.return_value = ("UIDVALIDITY", [b"7"])
    client.uid.return_value = ("OK", [(b"1", message.as_bytes())])
    with patch.object(mail.imaplib, "IMAP4_SSL", return_value=client):
        result = mail.read_message({"address": "test@example.invalid", "password": "test"}, 1, 7)
    assert "DOCUMENT_TITLE_ONLY" not in result["html_body"]
    assert "a:hover" not in result["html_body"]
    assert "Confirm your account" in result["html_body"]
    client.select.assert_called_once_with("INBOX", readonly=True)
    client.uid.assert_called_once_with("fetch", "1", "(BODY.PEEK[]<0.2097152>)")
