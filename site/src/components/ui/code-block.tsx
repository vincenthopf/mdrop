import { cn } from '@/lib/utils';

interface CodeBlockProps {
	label?: string;
	children: React.ReactNode;
	className?: string;
}

export function CodeBlock({ label, children, className }: CodeBlockProps) {
	return (
		<div
			className={cn(
				'relative bg-bg-code border-2 border-border-heavy shadow-[8px_8px_0_var(--color-accent)] p-6',
				className,
			)}
		>
			{label && (
				<span className="absolute -top-3 left-4 bg-bg px-2 text-[0.65rem] text-accent font-bold tracking-widest uppercase">
					{label}
				</span>
			)}
			<pre className="text-sm leading-relaxed overflow-x-auto">{children}</pre>
		</div>
	);
}
