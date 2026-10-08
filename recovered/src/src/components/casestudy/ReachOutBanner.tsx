'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import CopyableEmail from '@/components/casestudy/CopyableEmail';
import { CASE_STUDY_PASSWORD, emitCaseStudyUnlock } from '@/components/casestudy/caseStudyPassword';

const BULLET = '•';
const REVEAL_MS = 800;

function maskPassword(value: string, revealLast: boolean) {
  if (!value) return '';
  if (!revealLast) return BULLET.repeat(value.length);
  if (value.length === 1) return value;
  return BULLET.repeat(value.length - 1) + value.slice(-1);
}

function LockIcon() {
  return (
    <svg className="reach-out__lock" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C9.23858 2.25 7 4.48858 7 7.25V9H6.75C5.23122 9 4 10.2312 4 11.75V19.25C4 20.7688 5.23122 22 6.75 22H17.25C18.7688 22 20 20.7688 20 19.25V11.75C20 10.2312 18.7688 9 17.25 9H17V7.25C17 4.48858 14.7614 2.25 12 2.25ZM15.5 9V7.25C15.5 5.317 13.933 3.75 12 3.75C10.067 3.75 8.5 5.317 8.5 7.25V9H15.5ZM12 13.25C12.4142 13.25 12.75 13.5858 12.75 14V17C12.75 17.4142 12.4142 17.75 12 17.75C11.5858 17.75 11.25 17.4142 11.25 17V14C11.25 13.5858 11.5858 13.25 12 13.25Z" fill="currentColor" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="reach-out__warn" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M9.63618 3.25763C10.7021 1.46491 13.2977 1.4649 14.3636 3.25763L21.8476 15.8443C22.9376 17.6774 21.6165 19.9998 19.4839 19.9998H4.51593C2.38326 19.9998 1.06225 17.6774 2.15221 15.8443L9.63618 3.25763ZM12 7.99976C12.4142 7.99976 12.75 8.33554 12.75 8.74976V12.7498C12.75 13.164 12.4142 13.4998 12 13.4998C11.5858 13.4998 11.25 13.164 11.25 12.7498V8.74976C11.25 8.33554 11.5858 7.99976 12 7.99976ZM13 15.4998C13 16.052 12.5523 16.4998 12 16.4998C11.4477 16.4998 11 16.052 11 15.4998C11 14.9475 11.4477 14.4998 12 14.4998C12.5523 14.4998 13 14.9475 13 15.4998Z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="reach-out__check" aria-hidden="true" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M19.7071 6.29289C20.0976 6.68342 20.0976 7.31658 19.7071 7.70711L10.7071 16.7071C10.3166 17.0976 9.68342 17.0976 9.29289 16.7071L4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929C4.68342 9.90237 5.31658 9.90237 5.70711 10.2929L10 14.5858L18.2929 6.29289C18.6834 5.90237 19.3166 5.90237 19.7071 6.29289Z" fill="currentColor" />
    </svg>
  );
}

export default function ReachOutBanner({
  variant = 'panel',
  showRule = true,
  lead,
}: {
  variant?: 'panel' | 'quote' | 'note';
  showRule?: boolean;
  /** Optional lead copy. When set, replaces the default password-protected lines. */
  lead?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<number>(0);
  const [value, setValue] = useState('');
  const [revealLast, setRevealLast] = useState(false);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(false);
  const [caretX, setCaretX] = useState(0);
  const [blinkKey, setBlinkKey] = useState(0);
  const shown = maskPassword(value, revealLast);
  const isNote = variant === 'note';
  const isQuote = variant === 'quote';

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  useLayoutEffect(() => {
    const update = () => setCaretX(measureRef.current?.offsetWidth ?? 0);
    update();
    void document.fonts.ready.then(update);
  }, [shown, focused]);

  function setPassword(next: string, reveal: boolean) {
    setValue(next);
    window.clearTimeout(hideTimer.current);
    setBlinkKey((key) => key + 1);
    if (reveal && next.length > 0) {
      setRevealLast(true);
      hideTimer.current = window.setTimeout(() => setRevealLast(false), REVEAL_MS);
    } else {
      setRevealLast(false);
    }
  }

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    const shown = maskPassword(value, revealLast);
    if (error) setError(false);

    if (raw.length < shown.length) {
      const removed = shown.length - raw.length;
      setPassword(value.slice(0, Math.max(0, value.length - removed)), false);
      return;
    }

    if (raw.length > shown.length) {
      setPassword(value + raw.slice(shown.length), true);
      return;
    }

    if (raw !== shown && raw.length > 0) {
      setPassword(value.slice(0, -1) + raw.slice(-1), true);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (success) return;
    // Case-insensitive: "Cherry", "cherry" and "CHERRY" all unlock. Phone
    // keyboards auto-capitalise, so an exact match would reject the word people
    // were told to type.
    if (value.trim().toLowerCase() === CASE_STUDY_PASSWORD.toLowerCase()) {
      setSuccess(true);
      setError(false);
      setShaking(false);
      emitCaseStudyUnlock();
      return;
    }
    setError(true);
    setShaking(true);
    setPassword('', false);
    inputRef.current?.focus();
  }

  const gate = (
    <form
      className="reach-out__gate"
      data-status={success ? 'success' : error ? 'error' : 'idle'}
      onSubmit={handleSubmit}
    >
      <label className="reach-out__sr" htmlFor="reach-out-password">
        Password
      </label>
      <div className="reach-out__field-wrap">
        <div
          className={`reach-out__field${shaking ? ' is-shaking' : ''}${error ? ' is-error' : ''}`}
          onClick={() => inputRef.current?.focus()}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) setShaking(false);
          }}
        >
          <div className="reach-out__input-slot">
            <span ref={measureRef} className="reach-out__caret-measure" aria-hidden="true">
              {shown}
            </span>
            {focused && !success ? (
              <span
                key={blinkKey}
                className="reach-out__caret"
                style={{ transform: `translate(${caretX}px, -50%)` }}
                aria-hidden="true"
              />
            ) : null}
            <input
              id="reach-out-password"
              ref={inputRef}
              className="reach-out__input"
              type="text"
              name="password"
              placeholder="Enter password"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              value={shown}
              disabled={success}
              aria-invalid={error}
              aria-describedby={error ? 'reach-out-password-error' : undefined}
              onFocus={() => {
                setFocused(true);
                setBlinkKey((key) => key + 1);
              }}
              onBlur={() => setFocused(false)}
              onChange={handlePasswordChange}
            />
          </div>
          <button
            className="reach-out__button"
            type="submit"
            disabled={success || value.trim().length === 0}
            aria-label={success ? 'Unlocked' : 'Send'}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="reach-out__send-live">
              <span className="reach-out__send-label">{'Send'}</span>
              <span className="reach-out__send-done">
                <CheckIcon />
              </span>
            </span>
          </button>
        </div>
        {error ? (
          <p id="reach-out-password-error" className="reach-out__error" role="alert">
            <WarningIcon />
            {'Incorrect password'}
          </p>
        ) : null}
      </div>
    </form>
  );

  if (isNote) {
    return (
      <div className="reach-out reach-out--note">
        <div className="reach-out__art" aria-hidden="true">
          <div className="reach-out__art-badge">
            <LockIcon />
          </div>
        </div>
        <div className="reach-out__copy">
          <p className="reach-out__topic">{'Password protected'}</p>
          <p className="reach-out__lead">
            {'Reach out to '}
            <CopyableEmail />
            {' for details.'}
          </p>
        </div>
        {gate}
      </div>
    );
  }

  return (
    <div className={isQuote ? 'reach-out reach-out--quote' : 'reach-out'}>
      {isQuote && showRule ? <span className="reach-out__rule" aria-hidden="true" /> : null}
      <div className="reach-out__frame">
        <div className="reach-out__body">
          <LockIcon />
          <div className="reach-out__copy">
            <p className="reach-out__lead">
              {lead ? (
                <>
                  <span className="reach-out__lead--short">{lead}</span>
                  <span className="reach-out__lead--long">{lead}</span>
                </>
              ) : (
                <>
                  <span className="reach-out__lead--short">
                    {'The rest of this project is password protected. Reach out to '}
                    <CopyableEmail />
                    {' for details.'}
                  </span>
                  <span className="reach-out__lead--long">
                    {'The rest of this project is password protected'}
                  </span>
                </>
              )}
            </p>
            <p className="reach-out__sub">
              {'Reach out to '}
              <CopyableEmail />
              {' for details.'}
            </p>
          </div>
          {gate}
        </div>
      </div>
    </div>
  );
}
