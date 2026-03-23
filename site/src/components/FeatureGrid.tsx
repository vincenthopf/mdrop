import { useRef } from "react";
import { TerminalIcon, type TerminalIconHandle } from "./ui/terminal";
import { SparklesIcon, type SparklesIconHandle } from "./ui/sparkles";
import {
  CircleDollarSignIcon,
  type CircleDollarSignIconHandle,
} from "./ui/circle-dollar-sign";
import { ClockIcon, type ClockIconHandle } from "./ui/clock";
import { FileTextIcon, type FileTextIconHandle } from "./ui/file-text";
import {
  ShieldCheckIcon,
  type ShieldCheckIconHandle,
} from "./ui/shield-check";

type IconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

const features = [
  {
    key: "terminal",
    title: "CLI-First",
    desc: "No browser. No dashboard. One command, one URL. Share from where you already work.",
  },
  {
    key: "sparkles",
    title: "Beautiful Code",
    desc: "Shiki-powered syntax highlighting with VS Code accuracy. Inline styles, instant rendering.",
  },
  {
    key: "dollar",
    title: "Actually Free",
    desc: "Runs on Cloudflare's free tier. 100K reads, 1K writes, 1GB storage. No credit card. No catch.",
  },
  {
    key: "clock",
    title: "Links That Expire",
    desc: "Set --expires 1h, 7d, or never. Powered by native KV TTL. No cron jobs cleaning up.",
  },
  {
    key: "filetext",
    title: "Full GFM",
    desc: "Tables, task lists, strikethrough, autolinks. Auto-generated table of contents baked in.",
  },
  {
    key: "shield",
    title: "You Own It",
    desc: "Deploy to your own Cloudflare account. Your data, your domain, your rules. MIT licensed.",
  },
] as const;

function FeatureCard({
  feature,
  index,
  renderIcon,
  iconRef,
}: {
  feature: (typeof features)[number];
  index: number;
  renderIcon: () => React.ReactNode;
  iconRef: React.RefObject<IconHandle | null>;
}) {
  return (
    <div
      data-animate="fade-up"
      data-delay={String(0.08 * (index + 1))}
      className="w-full max-w-md md:max-w-none flex gap-4 md:gap-5 items-start bg-bg-card border-2 border-border p-5 md:p-8 transition-all duration-200 hover:border-accent"
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <div className="shrink-0 w-11 h-11 border-2 border-accent flex items-center justify-center">
        {renderIcon()}
      </div>
      <div>
        <h3 className="text-sm font-black uppercase text-white mb-2">
          {feature.title}
        </h3>
        <p className="text-sm text-fg-muted leading-relaxed">{feature.desc}</p>
      </div>
    </div>
  );
}

export default function FeatureGrid() {
  const terminalRef = useRef<TerminalIconHandle>(null);
  const sparklesRef = useRef<SparklesIconHandle>(null);
  const dollarRef = useRef<CircleDollarSignIconHandle>(null);
  const clockRef = useRef<ClockIconHandle>(null);
  const fileTextRef = useRef<FileTextIconHandle>(null);
  const shieldRef = useRef<ShieldCheckIconHandle>(null);

  const iconMap: Record<
    string,
    { ref: React.RefObject<IconHandle | null>; render: () => React.ReactNode }
  > = {
    terminal: {
      ref: terminalRef,
      render: () => (
        <TerminalIcon ref={terminalRef} className="size-5 text-accent" />
      ),
    },
    sparkles: {
      ref: sparklesRef,
      render: () => (
        <SparklesIcon ref={sparklesRef} className="size-5 text-accent" />
      ),
    },
    dollar: {
      ref: dollarRef,
      render: () => (
        <CircleDollarSignIcon
          ref={dollarRef}
          className="size-5 text-accent"
        />
      ),
    },
    clock: {
      ref: clockRef,
      render: () => (
        <ClockIcon ref={clockRef} className="size-5 text-accent" />
      ),
    },
    filetext: {
      ref: fileTextRef,
      render: () => (
        <FileTextIcon ref={fileTextRef} className="size-5 text-accent" />
      ),
    },
    shield: {
      ref: shieldRef,
      render: () => (
        <ShieldCheckIcon ref={shieldRef} className="size-5 text-accent" />
      ),
    },
  };

  return (
    <div className="grid gap-5 justify-items-center md:grid-cols-2 md:justify-items-stretch">
      {features.map((feature, i) => {
        const icon = iconMap[feature.key];
        return (
          <FeatureCard
            key={feature.key}
            feature={feature}
            index={i}
            renderIcon={icon.render}
            iconRef={icon.ref}
          />
        );
      })}
    </div>
  );
}
