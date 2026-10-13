"""Keep email layout without permitting executable markup or remote resources."""
import base64
import re
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


def sanitize_email_html(content):
    return bleach.clean(content,
        tags={'a','p','div','span','br','hr','table','thead','tbody','tfoot','tr','td','th','b','strong','i','em','u','s','blockquote','pre','code','ul','ol','li','h1','h2','h3','h4','h5','h6','img','center'},
        attributes={'*':['style','title','dir'], 'a':link_attribute, 'img':image_attribute,
                    'table':['width','cellpadding','cellspacing','border','align','bgcolor'],
                    'td':['width','height','colspan','rowspan','align','valign','bgcolor'],
                    'th':['width','colspan','rowspan','align','valign']},
        protocols={'http','https','mailto','data'}, strip=True,
        css_sanitizer=CSSSanitizer(allowed_css_properties=ALLOWED_CSS_PROPERTIES | {
            'margin','margin-top','margin-bottom','margin-left','margin-right','padding','padding-top','padding-bottom','padding-left','padding-right',
            'border','border-top','border-bottom','border-left','border-right','border-radius','max-width','min-width','max-height','min-height','word-break','overflow-wrap'}))
