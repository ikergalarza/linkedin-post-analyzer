# -*- coding: utf-8 -*-
import os, json, urllib.request, urllib.error, time, datetime

B = os.environ['UNIPILE_BASE_URL'].rstrip('/')
K = os.environ['UNIPILE_API_KEY']
A = os.environ['UNIPILE_ACCOUNT_ID']
H = {'X-API-KEY': K, 'Accept': 'application/json', 'Content-Type': 'application/json'}

def _req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(B + path, data=data, headers=H, method=method)
    for i in range(6):
        try:
            with urllib.request.urlopen(r, timeout=60) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and i < 5:
                time.sleep(20 + 25*i); continue
            return {'_error': e.code, '_body': e.read()[:300].decode('utf8', 'replace')}
        except Exception as e:
            if i < 2:
                time.sleep(2); continue
            return {'_error': 'exc', '_body': str(e)}

def company(ident):
    return _req('GET', '/api/v1/linkedin/company/%s?account_id=%s' % (urllib.parse.quote(str(ident)), A))

def user(ident):
    return _req('GET', '/api/v1/users/%s?account_id=%s' % (urllib.parse.quote(str(ident)), A))

def comments(pid, limit=20):
    return _req('GET', '/api/v1/users/%s/comments?account_id=%s&limit=%d' % (urllib.parse.quote(str(pid)), A, limit))

def search_people(keywords, extra=None, limit=25):
    body = {'api': 'classic', 'category': 'people', 'keywords': keywords}
    if extra: body.update(extra)
    return _req('POST', '/api/v1/linkedin/search?account_id=%s&limit=%d' % (A, limit), body)

def search_companies(keywords, extra=None, limit=25):
    body = {'api': 'classic', 'category': 'companies', 'keywords': keywords}
    if extra: body.update(extra)
    return _req('POST', '/api/v1/linkedin/search?account_id=%s&limit=%d' % (A, limit), body)

import urllib.parse
