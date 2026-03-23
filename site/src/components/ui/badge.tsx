import { cn } from '@/lib/utils';

interface BadgeProps {
	children: React.ReactNode;
	className?: string;
}

export function Badge({ children, className }: BadgeProps) {
	return (
		<span
			className={cn(
				'inline-block border-2 border-accent px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-light',
				className,
			)}
		>
			{children}
		</span>
	);
}
