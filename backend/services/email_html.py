"""Keep email layout without permitting executable markup or remote resources."""
import bleach
from bleach.css_sanitizer import CSSSanitizer, ALLOWED_CSS_PROPERTIES


def sanitize_email_html(content):
    return bleach.clean(content,
        tags={'a','p','div','span','br','hr','table','thead','tbody','tfoot','tr','td','th','b','strong','i','em','u','s','blockquote','pre','code','ul','ol','li','h1','h2','h3','h4','h5','h6','img','center'},
        attributes={'*':['style','title','dir'], 'a':['href'], 'img':['src','alt','width','height'],
                    'table':['width','cellpadding','cellspacing','border','align','bgcolor'],
                    'td':['width','height','colspan','rowspan','align','valign','bgcolor'],
                    'th':['width','colspan','rowspan','align','valign']},
        protocols={'http','https','mailto'}, strip=True,
        css_sanitizer=CSSSanitizer(allowed_css_properties=ALLOWED_CSS_PROPERTIES | {
            'margin','margin-top','margin-bottom','margin-left','margin-right','padding','padding-top','padding-bottom','padding-left','padding-right',
            'border','border-top','border-bottom','border-left','border-right','border-radius','max-width','min-width','max-height','min-height','word-break','overflow-wrap'}))
