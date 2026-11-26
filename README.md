# dsh-chrome-dictation

Dictate into the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) message
composer with the speech recognition Chrome already ships. No local model, no dependency
install: recognition happens in Chrome's speech service.

This is a DSH-only plugin: it adds a microphone to the DSH Web composer and has no effect
outside DeepSeek Harness.

## Requirements

- DeepSeek Harness `^0.2.3-alpha.2` (Web GUI).
- Chrome or Edge. Firefox and Safari expose no built-in recognizer; the microphone explains
  that instead of silently doing nothing.
- A secure page (`localhost` counts) and a network route to Chrome's speech service. That
  service is remote: recognition needs a proxy where the service is blocked.

## Install

**From a plugin index (Discover).** Turn on **Custom plugin indexes** under Experimental
plugins, open **Plugins → Discover → Add index source**, and add:

```text
https://raw.githubusercontent.com/EricZhou0815/dsh-chrome-dictation/main/index.json
```

**By package name.** Once published to npm, **Plugins → Add plugin** accepts
`dsh-chrome-dictation`.

**From Git.** **Plugins → Add plugin** with a pinned commit:

```text
git+https://github.com/EricZhou0815/dsh-chrome-dictation.git#<40-hex-commit>
```

**From a local directory.** **Plugins → Add plugin** with the checkout path.

Installing enables the bundle immediately. Reload the Web page once so the browser half
loads.

## Use it

1. Pick the dictation language from the dropdown left of the microphone (中文, English, 粤语,
   繁體, 日本語, 한국어). It starts from the DSH interface language and remembers your choice.
2. Click the microphone in the composer tool row, next to the model selector.
3. Speak. The row shows the live partial transcript while it listens.
4. Click the round stop button to insert the transcript at the caret in the unsent draft, or
   the left close button (or Escape) to throw the recording away. Dictation never submits the
   message.

The first use asks for microphone permission; the row says so while the prompt is open. Long
pauses end recognition on their own, and the finished text is inserted then.

## Failures

- A denied microphone, a blocked recognition service, and a network failure each show a short
  reason instead of failing silently.
- Text captured before a failure is kept: the error row offers **Insert** to place it at the
  caret, or **Close** to discard it.
- If the draft changed while dictating, the transcript is kept the same way instead of landing
  in text the user has since edited.
- "No speech detected" is a normal outcome: it shows as a neutral note and clears itself.

## What it changes in DSH

DSH ships an optional **Voice input** bundle whose microphone transcribes locally with
SenseVoice, installing dependencies and downloading model files on first use. Dictation and
that microphone share one composer seat, so this bundle's patch disables the shipped
`ui-voice-input` row while it is installed. Remove this bundle to get the SenseVoice
microphone back. No recorded audio is kept by either control.

## Limits

- Chrome and Edge only, secure pages only.
- Chrome ends a recognition session on a long pause and caps a single session's runtime; long
  dictation needs more than one click.
- The transcript is plain text: no Markdown, attachments, or automatic submission.
- The recognizer language is fixed per session; switch the dropdown before you start.

## Development

| File | Role |
|---|---|
| `package.json` | bundle patch plus `dsh.client` declaration |
| `cordis.patch.yml` | inserts this plugin, disables the shipped `ui-voice-input` |
| `index.js` | Host half (empty: recognition and rendering live in the browser) |
| `client.js` | browser half: microphone, language dropdown, Web Speech API |
| `locale/*.json` | plugin-manager title and description |
| `icon.svg` | plugin icon |

The browser half ships as plain JavaScript for the DSH client module loader; there is no
build step. After editing `client.js`, reload the DSH Web page.

## License

MIT
