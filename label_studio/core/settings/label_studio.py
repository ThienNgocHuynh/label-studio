"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from core.settings.base import *

DJANGO_DB = get_env('DJANGO_DB', DJANGO_DB_POSTGRESQL)
DATABASES = {'default': DATABASES_ALL[DJANGO_DB]}

MIDDLEWARE.append('organizations.middleware.DummyGetSessionMiddleware')
MIDDLEWARE.append('core.middleware.UpdateLastActivityMiddleware')

ADD_DEFAULT_ML_BACKENDS = False

LOGGING['root']['level'] = get_env('LOG_LEVEL', 'WARNING')

DEBUG = get_bool_env('DEBUG', False)

DEBUG_PROPAGATE_EXCEPTIONS = get_bool_env('DEBUG_PROPAGATE_EXCEPTIONS', False)

SESSION_COOKIE_SECURE = False

SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"

RQ_QUEUES = {}

SENTRY_DSN = get_env(
    'SENTRY_DSN',
    'https://68b045ab408a4d32a910d339be8591a4@o227124.ingest.sentry.io/5820521'
)
SENTRY_ENVIRONMENT = get_env('SENTRY_ENVIRONMENT', 'opensource')

FRONTEND_SENTRY_DSN = get_env(
    'FRONTEND_SENTRY_DSN',
    'https://5f51920ff82a4675a495870244869c6b@o227124.ingest.sentry.io/5838868')
FRONTEND_SENTRY_ENVIRONMENT = get_env('FRONTEND_SENTRY_ENVIRONMENT', 'opensource')

EDITOR_KEYMAP = json.dumps(get_env("EDITOR_KEYMAP"))

HEADERS = {
    'Authorization': 'Basic dWlzcHJpbnQ6a21zMTIz',
    'Content-Type': 'application/json'
}

SKETCH2DESIGN = "http://ec2-3-212-19-35.compute-1.amazonaws.com/sketch-2-design"

SCREENSHOT2DESIGN = "http://ec2-3-212-19-35.compute-1.amazonaws.com/screenshot-2-design"

OCR = "http://ec2-44-198-203-147.compute-1.amazonaws.com/ocr"

DOWNLOAD_URL = "http://localhost"

from label_studio import __version__
from label_studio.core.utils import sentry
sentry.init_sentry(release_name='label-studio', release_version=__version__)

# we should do it after sentry init
from label_studio.core.utils.common import collect_versions
versions = collect_versions()
