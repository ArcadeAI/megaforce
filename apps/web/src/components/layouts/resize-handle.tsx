import { cn } from "@/lib/utils";

interface ResizeHandleProperties {
	onResize: (delta: number) => void;
	className?: string;
	direction?: "horizontal" | "vertical";
}

export function ResizeHandle({
	onResize,
	className,
	direction = "horizontal",
}: ResizeHandleProperties) {
	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();

		const startX = e.clientX;
		const startY = e.clientY;

		const handleMouseMove = (moveEvent: MouseEvent) => {
			const delta =
				direction === "horizontal"
					? moveEvent.clientX - startX
					: moveEvent.clientY - startY;
			onResize(delta);
		};

		const handleMouseUp = () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		document.body.style.cursor =
			direction === "horizontal" ? "col-resize" : "row-resize";
		document.body.style.userSelect = "none";
	};

	return (
		<button
			type="button"
			onMouseDown={handleMouseDown}
			className={cn(
				"group hover:bg-primary/10 relative flex items-center justify-center border-0 bg-transparent p-0 transition-colors",
				direction === "horizontal"
					? "w-1 cursor-col-resize"
					: "h-1 cursor-row-resize",
				className,
			)}
			aria-label={`Resize ${direction === "horizontal" ? "horizontal" : "vertical"} panel`}
		>
			<div
				className={cn(
					"bg-border group-hover:bg-primary/50 transition-colors",
					direction === "horizontal" ? "h-full w-px" : "h-px w-full",
				)}
			/>
		</button>
	);
}
