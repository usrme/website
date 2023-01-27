---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-03-09
title: "'--preload' exposes additional logs in Gunicorn"
---
All good things start with curious error messages:

```bash
$ gunicorn start:app
[2022-03-09 07:41:08 +0000] [35] [INFO] Starting gunicorn 20.1.0
[2022-03-09 07:41:08 +0000] [35] [INFO] Listening at: http://0.0.0.0:5000 (35)
[2022-03-09 07:41:08 +0000] [35] [INFO] Using worker: gthread
[2022-03-09 07:41:08 +0000] [37] [INFO] Booting worker with pid: 37
[2022-03-09 07:41:08 +0000] [38] [INFO] Booting worker with pid: 38
[2022-03-09 07:41:08 +0000] [35] [WARNING] Worker with pid 38 was terminated due to signal 15
[2022-03-09 07:41:08 +0000] [35] [INFO] Shutting down: Master
[2022-03-09 07:41:08 +0000] [35] [INFO] Reason: Worker failed to boot.
```

Not all that helpful, is it? How about if we increase the log level?

```bash
$ gunicorn start:app --log-level debug
[2022-03-09 07:43:37 +0000] [40] [DEBUG] Current configuration:
  config: ./gunicorn.conf.py
  wsgi_app: None
  bind: ['0.0.0.0:5000']
  backlog: 2048
  workers: 2
  worker_class: gthread
  threads: 4
  <other configuration options>
[2022-03-09 07:43:37 +0000] [40] [INFO] Starting gunicorn 20.1.0
[2022-03-09 07:43:37 +0000] [40] [DEBUG] Arbiter booted
[2022-03-09 07:43:37 +0000] [40] [INFO] Listening at: http://0.0.0.0:5000 (40)
[2022-03-09 07:43:37 +0000] [40] [INFO] Using worker: gthread
[2022-03-09 07:43:37 +0000] [42] [INFO] Booting worker with pid: 42
[2022-03-09 07:43:37 +0000] [43] [INFO] Booting worker with pid: 43
[2022-03-09 07:43:37 +0000] [40] [DEBUG] 2 workers
[2022-03-09 07:43:37 +0000] [40] [WARNING] Worker with pid 43 was terminated due to signal 15
[2022-03-09 07:43:37 +0000] [40] [INFO] Shutting down: Master
[2022-03-09 07:43:37 +0000] [40] [INFO] Reason: Worker failed to boot.
```

What is this signal 15?

```bash
$ kill -l
 1) SIGHUP       2) SIGINT       3) SIGQUIT      4) SIGILL       5) SIGTRAP
 6) SIGABRT      7) SIGBUS       8) SIGFPE       9) SIGKILL     10) SIGUSR1
11) SIGSEGV     12) SIGUSR2     13) SIGPIPE     14) SIGALRM     15) SIGTERM
16) SIGSTKFLT   17) SIGCHLD     18) SIGCONT     19) SIGSTOP     20) SIGTSTP
21) SIGTTIN     22) SIGTTOU     23) SIGURG      24) SIGXCPU     25) SIGXFSZ
26) SIGVTALRM   27) SIGPROF     28) SIGWINCH    29) SIGIO       30) SIGPWR
31) SIGSYS      34) SIGRTMIN    35) SIGRTMIN+1  36) SIGRTMIN+2  37) SIGRTMIN+3
38) SIGRTMIN+4  39) SIGRTMIN+5  40) SIGRTMIN+6  41) SIGRTMIN+7  42) SIGRTMIN+8
43) SIGRTMIN+9  44) SIGRTMIN+10 45) SIGRTMIN+11 46) SIGRTMIN+12 47) SIGRTMIN+13
48) SIGRTMIN+14 49) SIGRTMIN+15 50) SIGRTMAX-14 51) SIGRTMAX-13 52) SIGRTMAX-12
53) SIGRTMAX-11 54) SIGRTMAX-10 55) SIGRTMAX-9  56) SIGRTMAX-8  57) SIGRTMAX-7
58) SIGRTMAX-6  59) SIGRTMAX-5  60) SIGRTMAX-4  61) SIGRTMAX-3  62) SIGRTMAX-2
63) SIGRTMAX-1  64) SIGRTMAX
```

So signal 15 is equivalent to `SIGTERM`, also known as the graceful termination signal. The [Gunicorn documentation on signals](https://docs.gunicorn.org/en/stable/signals.html#worker-process) says the same. But we still don't know what's causing it to not run properly and this is where the ['--preload' option](https://docs.gunicorn.org/en/stable/settings.html?highlight=preload#preload-app) comes in. It loads the application code prior to forking the worker processes in an attempt to conserve RAM usage and to speed up the server boot times. I have no real need for this option other than for its ability to provide insight into the failure. So, let's drop the `--log-level debug` in favor of `--preload`:

```bash
$ gunicorn start:app --preload
Traceback (most recent call last):
  File "/app/.venv/bin/gunicorn", line 8, in <module>
    sys.exit(run())
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/app/wsgiapp.py", line 67, in run
    WSGIApplication("%(prog)s [OPTIONS] [APP_MODULE]").run()
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/app/base.py", line 231, in run
    super().run()
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/app/base.py", line 72, in run
    Arbiter(self).run()
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/arbiter.py", line 58, in __init__
    self.setup(app)
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/arbiter.py", line 118, in setup
    self.app.wsgi()
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/app/base.py", line 67, in wsgi
    self.callable = self.load()
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/app/wsgiapp.py", line 58, in load
    return self.load_wsgiapp()
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/app/wsgiapp.py", line 48, in load_wsgiapp
    return util.import_app(self.app_uri)
  File "/app/.venv/lib/python3.10/site-packages/gunicorn/util.py", line 359, in import_app
    mod = importlib.import_module(module)
  File "/usr/local/lib/python3.10/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
  File "<frozen importlib._bootstrap>", line 1050, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1027, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1006, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 688, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 883, in exec_module
  File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
  File "/app/start.py", line 3, in <module>
    app = create_app()
  File "/app/manager/__init__.py", line 41, in create_app
    from . import auth
  File "/app/manager/auth.py", line 4, in <module>
    from flask_oidc import OpenIDConnect
ModuleNotFoundError: No module named 'flask_oidc'
```

Success! Now all that's left is to install `flask_oidc` into the environment and observe that Gunicorn runs properly once again.
