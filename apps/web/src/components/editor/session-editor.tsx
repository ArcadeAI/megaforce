import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Code,
	Heading2,
	Heading3,
	Italic,
	List,
	ListOrdered,
	Redo2,
	Strikethrough,
	TextQuote,
	Underline as UnderlineIcon,
	Undo2,
} from "lucide-react";
import { marked } from "marked";
import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";

interface SessionEditorProperties {
	content: string;
	onChange?: (content: string) => void;
	editable: boolean;
	/** If true, treat content as markdown and convert to HTML before rendering */
	markdown?: boolean;
	placeholder?: string;
}

type Editor = NonNullable<ReturnType<typeof useEditor>>;

function ToolbarButton({
	onClick,
	active,
	disabled,
	children,
	title,
}: {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	children: React.ReactNode;
	title: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={cn(
				"text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-30",
				active && "bg-muted text-foreground",
			)}
		>
			{children}
		</button>
	);
}

function Divider() {
	return <div className="bg-border mx-0.5 h-5 w-px" />;
}

function Toolbar({ editor }: { editor: Editor }) {
	return (
		<div className="border-border flex items-center gap-0.5 border-b px-1.5 py-1">
			{/* Undo / Redo */}
			<ToolbarButton
				onClick={() => editor.chain().focus().undo().run()}
				disabled={!editor.can().undo()}
				title="Undo"
			>
				<Undo2 className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().redo().run()}
				disabled={!editor.can().redo()}
				title="Redo"
			>
				<Redo2 className="size-3.5" />
			</ToolbarButton>

			<Divider />

			{/* Inline formatting */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBold().run()}
				active={editor.isActive("bold")}
				title="Bold"
			>
				<Bold className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleItalic().run()}
				active={editor.isActive("italic")}
				title="Italic"
			>
				<Italic className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				active={editor.isActive("underline")}
				title="Underline"
			>
				<UnderlineIcon className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleStrike().run()}
				active={editor.isActive("strike")}
				title="Strikethrough"
			>
				<Strikethrough className="size-3.5" />
			</ToolbarButton>

			<Divider />

			{/* Headings */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				active={editor.isActive("heading", { level: 2 })}
				title="Heading 2"
			>
				<Heading2 className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				active={editor.isActive("heading", { level: 3 })}
				title="Heading 3"
			>
				<Heading3 className="size-3.5" />
			</ToolbarButton>

			<Divider />

			{/* Lists */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				active={editor.isActive("bulletList")}
				title="Bullet list"
			>
				<List className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				active={editor.isActive("orderedList")}
				title="Numbered list"
			>
				<ListOrdered className="size-3.5" />
			</ToolbarButton>

			<Divider />

			{/* Block-level */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
				active={editor.isActive("blockquote")}
				title="Blockquote"
			>
				<TextQuote className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleCodeBlock().run()}
				active={editor.isActive("codeBlock")}
				title="Code block"
			>
				<Code className="size-3.5" />
			</ToolbarButton>
		</div>
	);
}

function InlineBubbleMenu({ editor }: { editor: Editor }) {
	return (
		<BubbleMenu
			editor={editor}
			className="border-border bg-background flex items-center gap-0.5 border p-0.5 shadow-lg"
		>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBold().run()}
				active={editor.isActive("bold")}
				title="Bold"
			>
				<Bold className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleItalic().run()}
				active={editor.isActive("italic")}
				title="Italic"
			>
				<Italic className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				active={editor.isActive("underline")}
				title="Underline"
			>
				<UnderlineIcon className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleStrike().run()}
				active={editor.isActive("strike")}
				title="Strikethrough"
			>
				<Strikethrough className="size-3.5" />
			</ToolbarButton>
		</BubbleMenu>
	);
}

/** Convert markdown to HTML synchronously via marked */
function markdownToHtml(md: string): string {
	return marked.parse(md, { async: false });
}

export function SessionEditor({
	content,
	onChange,
	editable,
	markdown = false,
	placeholder,
}: SessionEditorProperties) {
	const htmlContent = useMemo(
		() => (markdown ? markdownToHtml(content) : content),
		[content, markdown],
	);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Placeholder.configure({
				placeholder: placeholder ?? "Start writing...",
			}),
		],
		content: htmlContent,
		editable,
		onUpdate: ({ editor: e }) => {
			onChange?.(e.getHTML());
		},
		editorProps: {
			attributes: {
				class: "session-editor-content outline-none min-h-[160px] p-4",
			},
		},
	});

	useEffect(() => {
		if (editor && editor.isEditable !== editable) {
			editor.setEditable(editable);
		}
	}, [editor, editable]);

	useEffect(() => {
		if (editor && htmlContent !== editor.getHTML()) {
			editor.commands.setContent(htmlContent);
		}
	}, [editor, htmlContent]);

	if (!editor) {
		return null;
	}

	return (
		<div
			className={cn(
				"border-border bg-background border transition-colors",
				editable && "focus-within:border-muted-foreground/40",
			)}
		>
			{editable && <Toolbar editor={editor} />}
			{editable && <InlineBubbleMenu editor={editor} />}
			<EditorContent editor={editor} />
		</div>
	);
}
