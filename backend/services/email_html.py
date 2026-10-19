"""Keep useful email layout while removing non-display and executable markup."""
import base64
import re
from html.parser import HTMLParser
from urllib.parse import unquote
import bleach
from bleach.css_sanitizer import CSSSanitizer, ALLOWED_CSS_PROPERTIES


def embed_email_images(content, message):
    images = {}
    for part in message.walk():
        content_id = str(part.get("Content-ID", "")).strip("<>")
        kind = part.get_content_type()
        if content_id and kind in {"image/png", "image/jpeg", "image/gif", "image/webp"}:
            payload = part.get_payload(decode=True)
            if payload:
                images[content_id] = f"data:{kind};base64," + base64.b64encode(payload).decode("ascii")
    return re.sub(r"cid:([^\s\"'<>]+)", lambda match: images.get(unquote(match[1]), match[0]), content, flags=re.I)


def image_attribute(tag, name, value):
    if name == "src":
        return value.lower().startswith(("https://", "http://", "data:image/png;base64,", "data:image/jpeg;base64,", "data:image/gif;base64,", "data:image/webp;base64,"))
    return name in {"alt", "width", "height"}


def link_attribute(tag, name, value):
    return name == "href" and value.lower().startswith(("https://", "http://", "mailto:"))


class _EmailBodyMarkup(HTMLParser):
    """Discard non-display subtrees before Bleach strips their surrounding tags.

    This is content extraction only; Bleach remains the final security boundary.
    Keep entities encoded so text cannot become markup during extraction.
    """
    hidden = frozenset({"head", "title", "style", "script", "template", "iframe", "object", "noscript"})

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.suppressed = []
        self.parts = []

    def handle_starttag(self, tag, attrs):
        # HTML permits </head> to be omitted before body content starts.
        if self.suppressed == ["head"] and tag not in self.hidden | {"base", "link", "meta"}:
            self.suppressed.clear()
        if tag in self.hidden:
            self.suppressed.append(tag)
        elif not self.suppressed:
            self.parts.append(self.get_starttag_text())

    def handle_startendtag(self, tag, attrs):
        if not self.suppressed and tag not in self.hidden:
            self.parts.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if tag in self.suppressed:
            # A malformed nested non-display element must not leak its text.
            index = len(self.suppressed) - 1 - self.suppressed[::-1].index(tag)
            del self.suppressed[index:]
        elif not self.suppressed:
            self.parts.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.suppressed:
            self.parts.append(data)

    def handle_entityref(self, name):
        if not self.suppressed:
            self.parts.append(f"&{name};")

    def handle_charref(self, name):
        if not self.suppressed:
            self.parts.append(f"&#{name};")


def sanitize_email_html(content):
    body = _EmailBodyMarkup()
    body.feed(content)
    body.close()
    return bleach.clean("".join(body.parts),
        tags={'a','p','div','span','br','hr','table','thead','tbody','tfoot','tr','td','th','b','strong','i','em','u','s','blockquote','pre','code','ul','ol','li','h1','h2','h3','h4','h5','h6','img','center'},
        attributes={'*':['style','title','dir'], 'a':link_attribute, 'img':image_attribute,
                    'table':['width','cellpadding','cellspacing','border','align','bgcolor'],
                    'td':['width','height','colspan','rowspan','align','valign','bgcolor'],
                    'th':['width','colspan','rowspan','align','valign']},
        protocols={'http','https','mailto','data'}, strip=True,
        css_sanitizer=CSSSanitizer(allowed_css_properties=ALLOWED_CSS_PROPERTIES | {
            'margin','margin-top','margin-bottom','margin-left','margin-right','padding','padding-top','padding-bottom','padding-left','padding-right',
            'border','border-top','border-bottom','border-left','border-right','border-radius','max-width','min-width','max-height','min-height','word-break','overflow-wrap'}))
