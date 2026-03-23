import { cn } from '@/lib/utils';

interface CardProps {
	children: React.ReactNode;
	className?: string;
	hover?: boolean;
}

export function Card({ children, className, hover = true }: CardProps) {
	return (
		<div
			className={cn(
				'border-2 border-border bg-bg-card p-8 transition-all duration-200',
				hover && 'hover:border-accent hover:shadow-[6px_6px_0_var(--color-accent)] hover:-translate-x-0.5 hover:-translate-y-0.5',
				className,
			)}
		>
			{children}
		</div>
	);
}
