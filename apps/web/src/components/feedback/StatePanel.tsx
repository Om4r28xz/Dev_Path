import type { ReactNode } from 'react';

type StateKind = 'loading' | 'empty' | 'error';

export function StatePanel({
  kind,
  title,
  children,
  action,
}: {
  kind: StateKind;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className="state-panel"
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
      aria-busy={kind === 'loading'}
    >
      <h2>{title}</h2>
      {children && <div>{children}</div>}
      {action && <div className="state-panel__actions">{action}</div>}
    </section>
  );
}
