window.__ModuleLoader__.load({
  id: 'dsh-chrome-dictation',
  factory(require) {
    const React = require('react')
    const { useEffect, useRef, useState } = React
    const h = React.createElement

    const NS = 'chrome-dictation'

    const zh = {
      start: '语音输入（Chrome 内置识别，无需下载）',
      stop: '停止并插入',
      cancel: '取消听写',
      close: '关闭',
      insert: '插入',
      waiting: '等待麦克风授权…',
      listening: '正在听写…',
      empty: '没有识别到语音。',
      conflict: '草稿已变化，转写文字没有插入。',
      denied: '麦克风被拒绝，请在地址栏允许麦克风后重试。',
      blocked: '浏览器禁止了语音识别服务。',
      network: '连不上 Chrome 的语音识别服务，请检查网络或代理。',
      noMic: '找不到麦克风设备。',
      unavailable: '语音识别服务不可用，请稍后重试。',
      unsupported: '当前浏览器没有 Chrome 内置语音识别，请用 Chrome 或 Edge 打开。',
      failed: '语音识别失败（{message}）',
      language: '听写语言：{language}',
      languageLabel: '听写语言',
    }

    const en = {
      start: 'Dictate with Chrome (no download)',
      stop: 'Stop and insert',
      cancel: 'Cancel dictation',
      close: 'Close',
      insert: 'Insert',
      waiting: 'Waiting for the microphone…',
      listening: 'Listening…',
      empty: 'No speech was detected.',
      conflict: 'The draft changed, so the transcript was not inserted.',
      denied: 'Microphone access was denied. Allow it in the address bar and try again.',
      blocked: 'The browser blocked its speech recognition service.',
      network: 'Chrome could not reach its speech service. Check the network or proxy.',
      noMic: 'No microphone was found.',
      unavailable: 'The speech service is unavailable. Try again later.',
      unsupported: 'This browser has no built-in Chrome speech recognition. Open DSH in Chrome or Edge.',
      failed: 'Speech recognition failed ({message})',
      language: 'Dictation language: {language}',
      languageLabel: 'Dictation language',
    }

    /** Chrome exposes the recognizer under a vendor prefix; other engines have none. */
    function Recognition() {
      return window.SpeechRecognition || window.webkitSpeechRecognition || undefined
    }

    /** Recognizer languages offered by the dropdown; add a row to offer more. */
    const LANGUAGES = [
      { tag: 'zh-CN', label: '中文' },
      { tag: 'en-US', label: 'English' },
      { tag: 'zh-HK', label: '粤语' },
      { tag: 'zh-TW', label: '繁體' },
      { tag: 'ja-JP', label: '日本語' },
      { tag: 'ko-KR', label: '한국어' },
    ]
    const STORAGE_KEY = 'dsh.chrome-dictation.lang'

    /** Map a DSH locale or browser language onto a recognizer tag; empty means "no opinion". */
    function speechLanguage(tag) {
      const raw = String(tag || '').toLowerCase()
      if (raw === '') return ''
      if (raw.startsWith('yue')) return 'zh-HK'
      if (raw.startsWith('zh')) return raw.includes('-hk') ? 'zh-HK' : raw.includes('-tw') ? 'zh-TW' : 'zh-CN'
      if (raw.startsWith('ja')) return 'ja-JP'
      if (raw.startsWith('ko')) return 'ko-KR'
      if (raw.startsWith('en')) return 'en-US'
      return raw.includes('-') ? String(tag) : ''
    }

    /** Keep only languages the dropdown can show, so the select never renders blank. */
    function knownLanguage(tag) {
      return LANGUAGES.some((item) => item.tag === tag) ? tag : ''
    }

    function labelOf(tag) {
      const known = LANGUAGES.find((item) => item.tag === tag)
      return known ? known.label : tag
    }

    function storedLanguage() {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        return stored === null || stored === '' ? '' : stored
      } catch (_error) { return '' }
    }

    function storeLanguage(tag) {
      try { window.localStorage.setItem(STORAGE_KEY, tag) } catch (_error) { /* private mode */ }
    }

    /** Chosen language, else the DSH interface language, else the page and browser language. */
    function initialLanguage(readLocale) {
      const stored = knownLanguage(storedLanguage())
      if (stored !== '') return stored
      const page = (typeof document !== 'undefined' && document.documentElement.lang) || ''
      const browser = (typeof navigator !== 'undefined' && navigator.language) || ''
      const candidates = [typeof readLocale === 'function' ? readLocale() : '', page, browser]
      for (const candidate of candidates) {
        const mapped = knownLanguage(speechLanguage(candidate))
        if (mapped !== '') return mapped
      }
      return 'en-US'
    }

    function messageFor(error, t) {
      if (error === 'not-allowed') return t('denied')
      if (error === 'service-not-allowed') return t('blocked')
      if (error === 'network') return t('network')
      if (error === 'audio-capture') return t('noMic')
      if (error === 'no-speech') return t('empty')
      if (error === 'language-not-supported' || error === 'service-unavailable') return t('unavailable')
      return t('failed', { message: error || 'unknown' })
    }

    const micIcon = h('svg', {
      width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
    }, h('rect', { x: 9, y: 3, width: 6, height: 11, rx: 3 }), h('path', { d: 'M5 11a7 7 0 0 0 14 0' }), h('path', { d: 'M12 18v3' }))

    const stopIcon = h('svg', {
      width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true,
    }, h('rect', { x: 7, y: 7, width: 10, height: 10, rx: 2 }))

    const caretIcon = h('svg', {
      width: 10, height: 10, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
    }, h('path', { d: 'M6 9l6 6 6-6' }))

    const closeIcon = h('svg', {
      width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 2, strokeLinecap: 'round', 'aria-hidden': true,
    }, h('path', { d: 'M6 6l12 12' }), h('path', { d: 'M18 6L6 18' }))

    const css = `
.bd-anchor { display: inline-flex; align-items: center; gap: 2px; flex: none; }
.bd-select { position: relative; display: inline-flex; align-items: center; flex: none; }
.bd-lang { max-width: 84px; height: 24px; padding: 0 15px 0 6px; flex: none; border: 0; border-radius: 6px;
  appearance: none; -webkit-appearance: none; background: transparent;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 24px;
  text-overflow: ellipsis; cursor: pointer; }
.bd-lang:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));
  color: var(--dsw-alias-label-primary); }
.bd-lang:disabled { opacity: .45; cursor: not-allowed; }
.bd-caret { position: absolute; right: 3px; display: inline-flex; pointer-events: none;
  color: var(--dsw-alias-label-tertiary); }
.bd-trigger { width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center;
  flex: none; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-primary); cursor: pointer; }
.bd-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); }
.bd-trigger:disabled { opacity: .45; cursor: not-allowed; }
.bd-row { display: flex; align-items: center; gap: 10px; width: 100%; min-width: 0; min-height: 34px; }
.bd-round { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center;
  flex: none; border: 0; border-radius: 50%; background: var(--dsw-specific-selector, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-secondary); cursor: pointer; }
.bd-round:hover { background: var(--dsw-alias-interactive-bg-hover-solid, var(--dsw-alias-interactive-bg-hover));
  color: var(--dsw-alias-label-primary); }
.bd-live { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
  font-size: 12px; color: var(--dsw-alias-label-secondary); }
.bd-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.bd-dot { width: 8px; height: 8px; flex: none; border-radius: 50%;
  background: var(--dsw-alias-state-business-primary, var(--dsw-alias-brand-primary));
  animation: bd-pulse 1.2s ease-in-out infinite; }
.bd-error { flex: 1; min-width: 0; color: var(--dsw-alias-state-error-primary); font-size: 12px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bd-notice { flex: 1; min-width: 0; color: var(--dsw-alias-label-secondary); font-size: 12px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bd-action { flex: none; padding: 4px 10px; border: 0; border-radius: 6px; background: transparent;
  color: var(--dsw-alias-state-business-primary, var(--dsw-alias-brand-primary)); font: inherit; font-size: 12px; cursor: pointer; }
.bd-action:hover { background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); }
@keyframes bd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
@media (prefers-reduced-motion: reduce) { .bd-dot { animation: none; } }
`

    /**
     * One microphone control that streams microphone audio through the browser's
     * built-in recognizer and inserts the final transcript into the unsent draft.
     */
    function Dictation({ inputActions, onActiveChange, locked, readLocale, t }) {
      const translate = typeof t === 'function' ? t : (key) => en[key] || key
      const supported = Recognition() !== undefined
      const [language, setLanguage] = useState(() => initialLanguage(readLocale))
      const [phase, setPhase] = useState('idle')
      const [interim, setInterim] = useState('')
      const [notice, setNotice] = useState('')
      const [failure, setFailure] = useState('')
      const [pending, setPending] = useState('')
      const recognition = useRef(null)
      const finals = useRef('')
      const interimRef = useRef('')
      const failureRef = useRef('')
      const generation = useRef(0)
      const started = useRef(false)
      const span = useRef(null)
      const stopButton = useRef(null)

      const dismiss = () => {
        setFailure('')
        setPending('')
        setNotice('')
        setPhase('idle')
      }

      /** Settle one recognition run: report its failure, its empty result, or insert its text. */
      const finalize = (reason) => {
        const active = recognition.current
        recognition.current = undefined
        generation.current += 1
        if (active) { active.onresult = null; active.onerror = null; active.onend = null }
        const text = (finals.current + interimRef.current).trim()
        finals.current = ''
        interimRef.current = ''
        setInterim('')
        if (reason === 'error') {
          const message = failureRef.current || translate('failed', { message: 'unknown' })
          failureRef.current = ''
          setPending(text)
          setFailure(message)
          setPhase('error')
          return
        }
        if (text === '') {
          setNotice(translate('empty'))
          setPhase('notice')
          return
        }
        if (span.current && inputActions.insertText(text, span.current)) { setPhase('idle'); return }
        setPending(text)
        setFailure(translate('conflict'))
        setPhase('error')
      }

      const cancel = () => {
        const active = recognition.current
        recognition.current = undefined
        generation.current += 1
        if (active) {
          active.onresult = null
          active.onerror = null
          active.onend = null
          try { active.abort() } catch (_error) { /* already ended */ }
        }
        finals.current = ''
        interimRef.current = ''
        failureRef.current = ''
        setInterim('')
        dismiss()
      }

      const stop = () => {
        const active = recognition.current
        if (!active) return
        if (!started.current) { cancel(); return }
        try { active.stop() } catch (_error) { finalize('auto') }
      }

      const insertPending = () => {
        if (pending === '') return
        if (inputActions.insertText(pending, inputActions.captureInsertion())) dismiss()
      }

      const start = () => {
        const Ctor = Recognition()
        if (!Ctor || locked || recognition.current) return
        const active = new Ctor()
        const run = ++generation.current
        finals.current = ''
        interimRef.current = ''
        failureRef.current = ''
        started.current = false
        span.current = inputActions.captureInsertion()
        setInterim('')
        setNotice('')
        setFailure('')
        setPending('')
        recognition.current = active
        active.lang = language
        active.continuous = true
        active.interimResults = true
        active.maxAlternatives = 1
        active.onstart = () => {
          if (run !== generation.current) return
          started.current = true
          setPhase('listening')
        }
        active.onresult = (event) => {
          if (run !== generation.current) return
          if (!started.current) { started.current = true; setPhase('listening') }
          let live = ''
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index]
            const text = result[0] ? result[0].transcript : ''
            if (result.isFinal) finals.current += text
            else live += text
          }
          interimRef.current = live
          setInterim(live)
        }
        active.onerror = (event) => {
          if (run !== generation.current) return
          if (event.error === 'aborted') return
          failureRef.current = messageFor(event.error, translate)
          finalize('error')
        }
        active.onend = () => {
          if (run !== generation.current) return
          finalize('auto')
        }
        setPhase('requesting')
        try { active.start() } catch (error) {
          recognition.current = undefined
          generation.current += 1
          setFailure(translate('failed', { message: String(error) }))
          setPhase('error')
        }
      }

      useEffect(() => {
        onActiveChange(phase !== 'idle')
        return () => { onActiveChange(false) }
      }, [phase, onActiveChange])

      useEffect(() => () => {
        const active = recognition.current
        recognition.current = undefined
        generation.current += 1
        if (active) {
          active.onresult = null
          active.onerror = null
          active.onend = null
          try { active.abort() } catch (_error) { /* already ended */ }
        }
        finals.current = ''
        interimRef.current = ''
      }, [])

      useEffect(() => {
        if (phase === 'listening' && stopButton.current) stopButton.current.focus()
      }, [phase])

      useEffect(() => {
        if (phase !== 'notice') return undefined
        const timer = setTimeout(() => { setPhase('idle') }, 2600)
        return () => clearTimeout(timer)
      }, [phase])

      useEffect(() => {
        if (phase === 'idle') return undefined
        const escape = (event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          if (phase === 'requesting' || phase === 'listening') cancel()
          else dismiss()
        }
        const hidden = () => {
          if (document.hidden && (phase === 'requesting' || phase === 'listening')) cancel()
        }
        document.addEventListener('keydown', escape)
        document.addEventListener('visibilitychange', hidden)
        return () => {
          document.removeEventListener('keydown', escape)
          document.removeEventListener('visibilitychange', hidden)
        }
      }, [phase])

      if (phase === 'requesting' || phase === 'listening') {
        const label = interim || translate(phase === 'requesting' ? 'waiting' : 'listening')
        return h('div', { className: 'bd-row', 'data-chrome-dictation': phase },
          h('style', null, css),
          h('button', { type: 'button', className: 'bd-round', 'aria-label': translate('cancel'),
            title: translate('cancel'), onClick: cancel }, closeIcon),
          h('span', { className: 'bd-live', role: 'status', 'aria-live': 'polite', title: label },
            h('span', { className: 'bd-dot' }),
            h('span', { className: 'bd-text' }, label)),
          h('button', { ref: stopButton, type: 'button', className: 'bd-round', 'aria-label': translate('stop'),
            title: translate('stop'), onClick: stop }, stopIcon))
      }

      if (phase === 'error') {
        return h('div', { className: 'bd-row', 'data-chrome-dictation': 'error' },
          h('style', null, css),
          h('span', { className: 'bd-error', role: 'alert', title: failure }, failure),
          pending === '' ? null : h('button', { type: 'button', className: 'bd-action', onClick: insertPending },
            translate('insert')),
          h('button', { type: 'button', className: 'bd-round', 'aria-label': translate('close'),
            title: translate('close'), onClick: dismiss }, closeIcon))
      }

      if (phase === 'notice') {
        return h('div', { className: 'bd-row', 'data-chrome-dictation': 'notice' },
          h('style', null, css),
          h('span', { className: 'bd-notice', role: 'status' }, notice))
      }

      const hint = supported ? translate('start') : translate('unsupported')
      const chooseLanguage = (event) => {
        const chosen = knownLanguage(event.target.value)
        if (chosen === '') return
        setLanguage(chosen)
        storeLanguage(chosen)
      }
      return h('div', null,
        h('style', null, css),
        h('span', { className: 'bd-anchor' },
          h('span', { className: 'bd-select' },
            h('select', { className: 'bd-lang', value: language, disabled: locked,
              title: translate('language', { language: labelOf(language) }),
              'aria-label': translate('languageLabel'),
              onChange: chooseLanguage },
              LANGUAGES.map((item) => h('option', { key: item.tag, value: item.tag }, item.label))),
            h('span', { className: 'bd-caret', 'aria-hidden': true }, caretIcon)),
          h('button', { type: 'button', className: 'bd-trigger', disabled: locked,
            title: hint, 'aria-label': hint, onMouseDown: (event) => { event.preventDefault() },
            onClick: () => {
              if (supported) start()
              else { setFailure(translate('unsupported')); setPhase('error') }
            } }, micIcon)))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }))
        const readLocale = () => ctx.locale.getLocale().active
        ctx.slots.inject('conversation.input.activity', () => ctx.slots.register({
          name: 'conversation.input.activity',
          locale: NS,
          inject: () => ({ readLocale }),
        }, Dictation))
      },
    }
  },
})
