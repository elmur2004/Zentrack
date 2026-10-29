import { Fragment, type ReactNode } from 'react';

/**
 * Renders a complete stored message, replacing {placeholders} with React nodes.
 * Use for messages that embed links or LTR tokens (+20, https://) that need <bdi> isolation.
 */
export function Rich({ text, values }: { text: string; values: Record<string, ReactNode> }) {
  const parts = text.split(/(\{\w+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\{(\w+)\}$/.exec(part);
        if (m && m[1] in values) return <Fragment key={i}>{values[m[1]]}</Fragment>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Latin identifier inside possibly-RTL text. */
export function Ltr({ children }: { children: ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}
