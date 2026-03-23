import { cn } from '@/lib/utils';

interface SectionHeaderProps {
	number: string;
	label: string;
	title: string;
	className?: string;
}

export function SectionHeader({ number, label, title, className }: SectionHeaderProps) {
	return (
		<div className={cn('text-center mb-16', className)}>
			<span className="block text-xs font-bold tracking-widest text-accent mb-3">
				/{number} {label}
			</span>
			<h2
				className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none text-white"
				dangerouslySetInnerHTML={{ __html: title }}
			/>
		</div>
	);
}
