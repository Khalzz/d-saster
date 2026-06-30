import { createPortal } from "react-dom";
import { useRef, useState } from "react";
import { Markdown } from "../Markdown";

interface ContentProps {
  title?: string;
  badge?: string;
  text: string;
}

// Wrapper mode: Tooltip wraps children and manages hover itself
interface WrapperMode extends ContentProps {
  children: React.ReactNode;
  className?: string;
  top?: never;
  left?: never;
  tooltipRef?: never;
}

// Controlled mode: position is managed externally (e.g. AutoTooltip)
interface ControlledMode extends ContentProps {
  top: number;
  left: number;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  children?: never;
  className?: never;
}

type TooltipProps = WrapperMode | ControlledMode;

function TooltipPortal({ tooltipRef, top, left, title, badge, text }: {
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  top: number;
  left: number;
} & ContentProps) {
  const content = [
    title ? `## ${title}${badge ? ` \`${badge}\`` : ""}` : null,
    text,
  ].filter(Boolean).join("\n\n");

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-50 -translate-x-1/2 -translate-y-full px-3 py-2 pointer-events-none bg-surface border border-gold-500/30 rounded-lg shadow-xl w-max max-w-md"
      style={{ top, left }}
    >
      <Markdown>{content}</Markdown>
    </div>,
    document.body
  );
}

export default function Tooltip(props: TooltipProps) {
  // Controlled mode — just render the portal, caller manages visibility
  if (props.top !== undefined) {
    return (
      <TooltipPortal
        tooltipRef={props.tooltipRef}
        top={props.top}
        left={props.left}
        title={props.title}
        badge={props.badge}
        text={props.text}
      />
    );
  }

  // Wrapper mode — self-managing hover
  return <TooltipWrapper {...props} />;
}

function TooltipWrapper({ children, className, title, badge, text }: WrapperMode) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [nudge, setNudge] = useState(0);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
      setNudge(0);
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const tipRect = tooltipRef.current.getBoundingClientRect();
          let offset = 0;
          if (tipRect.left < 8) offset = 8 - tipRect.left;
          else if (tipRect.right > window.innerWidth - 8) offset = window.innerWidth - 8 - tipRect.right;
          if (offset !== 0) setNudge(offset);
        }
      });
    }
    setVisible(true);
  };

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <TooltipPortal
          tooltipRef={tooltipRef}
          top={pos.top}
          left={pos.left + nudge}
          title={title}
          badge={badge}
          text={text}
        />
      )}
    </div>
  );
}
