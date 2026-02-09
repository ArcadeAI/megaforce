import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import type { Persona } from "@/lib/api/personas";
import { useCreatePersona, useUpdatePersona } from "@/lib/hooks/use-personas";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

const TONE_OPTIONS = [
	"neutral",
	"friendly",
	"authoritative",
	"conversational",
	"formal",
	"witty",
	"empathetic",
];

const FORMALITY_OPTIONS = ["casual", "neutral", "semi-formal", "formal"];

const HUMOR_OPTIONS = ["none", "light", "moderate", "heavy"];

const VOCABULARY_OPTIONS = [
	"simple",
	"intermediate",
	"advanced",
	"technical",
	"academic",
];

const PERSPECTIVE_OPTIONS = ["first-person", "second-person", "third-person"];

const SENTENCE_STYLE_OPTIONS = ["concise", "balanced", "elaborate", "varied"];

interface PersonaFormProps {
	persona?: Persona;
	onSuccess?: (persona: Persona) => void;
	compact?: boolean;
}

export function PersonaForm({ persona, onSuccess, compact }: PersonaFormProps) {
	const createPersona = useCreatePersona();
	const updatePersona = useUpdatePersona();
	const isEdit = !!persona;

	const style = (persona?.styleProfile ?? {}) as Record<string, string>;

	const form = useForm({
		defaultValues: {
			name: persona?.name ?? "",
			description: persona?.description ?? "",
			tone: style.tone ?? "neutral",
			formality: style.formality ?? "neutral",
			humor: style.humor ?? "none",
			vocabularyLevel: persona?.vocabularyLevel ?? "intermediate",
			perspective: persona?.perspective ?? "second-person",
			sentenceStyle: persona?.sentenceStyle ?? "balanced",
			sampleOutput: persona?.sampleOutput ?? "",
		},
		onSubmit: async ({ value }) => {
			const input = {
				name: value.name,
				description: value.description || "",
				styleProfile: {
					tone: value.tone,
					formality: value.formality,
					humor: value.humor,
				},
				vocabularyLevel: value.vocabularyLevel || "",
				perspective: value.perspective || "",
				sentenceStyle: value.sentenceStyle || "",
				sampleOutput: value.sampleOutput || "",
			};

			if (isEdit && persona) {
				updatePersona.mutate(
					{ id: persona.id, input },
					{
						onSuccess: (updated) => {
							toast.success("Persona updated");
							onSuccess?.(updated);
						},
						onError: (err) => {
							toast.error(err.message);
						},
					},
				);
			} else {
				createPersona.mutate(input, {
					onSuccess: (created) => {
						toast.success("Persona created");
						onSuccess?.(created);
					},
					onError: (err) => {
						toast.error(err.message);
					},
				});
			}
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(1, "Name is required"),
				description: z.string(),
				tone: z.string(),
				formality: z.string(),
				humor: z.string(),
				vocabularyLevel: z.string(),
				perspective: z.string(),
				sentenceStyle: z.string(),
				sampleOutput: z.string(),
			}),
		},
	});

	const isPending = createPersona.isPending || updatePersona.isPending;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			{/* Identity */}
			<div className="space-y-3">
				<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
					Identity
				</h3>
				<form.Field name="name">
					{(field) => (
						<div className="space-y-1.5">
							<Label htmlFor={field.name}>Name</Label>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="e.g. Friendly Expert"
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-red-500 text-xs">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<form.Field name="description">
					{(field) => (
						<div className="space-y-1.5">
							<Label htmlFor={field.name}>Description</Label>
							<Textarea
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Brief description of this persona..."
								rows={2}
							/>
						</div>
					)}
				</form.Field>
			</div>

			{/* Style */}
			<div className="space-y-3">
				<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
					Style
				</h3>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<form.Field name="tone">
						{(field) => (
							<div className="space-y-1.5">
								<Label>Tone</Label>
								<Select
									value={field.state.value}
									onValueChange={(v) => v != null && field.handleChange(v)}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TONE_OPTIONS.map((opt) => (
											<SelectItem key={opt} value={opt}>
												{opt}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					<form.Field name="formality">
						{(field) => (
							<div className="space-y-1.5">
								<Label>Formality</Label>
								<Select
									value={field.state.value}
									onValueChange={(v) => v != null && field.handleChange(v)}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{FORMALITY_OPTIONS.map((opt) => (
											<SelectItem key={opt} value={opt}>
												{opt}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					<form.Field name="humor">
						{(field) => (
							<div className="space-y-1.5">
								<Label>Humor</Label>
								<Select
									value={field.state.value}
									onValueChange={(v) => v != null && field.handleChange(v)}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{HUMOR_OPTIONS.map((opt) => (
											<SelectItem key={opt} value={opt}>
												{opt}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>
				</div>
			</div>

			{/* Voice */}
			<div className="space-y-3">
				<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
					Voice
				</h3>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<form.Field name="vocabularyLevel">
						{(field) => (
							<div className="space-y-1.5">
								<Label>Vocabulary</Label>
								<Select
									value={field.state.value}
									onValueChange={(v) => v != null && field.handleChange(v)}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{VOCABULARY_OPTIONS.map((opt) => (
											<SelectItem key={opt} value={opt}>
												{opt}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					<form.Field name="perspective">
						{(field) => (
							<div className="space-y-1.5">
								<Label>Perspective</Label>
								<Select
									value={field.state.value}
									onValueChange={(v) => v != null && field.handleChange(v)}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{PERSPECTIVE_OPTIONS.map((opt) => (
											<SelectItem key={opt} value={opt}>
												{opt}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					<form.Field name="sentenceStyle">
						{(field) => (
							<div className="space-y-1.5">
								<Label>Sentence Style</Label>
								<Select
									value={field.state.value}
									onValueChange={(v) => v != null && field.handleChange(v)}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SENTENCE_STYLE_OPTIONS.map((opt) => (
											<SelectItem key={opt} value={opt}>
												{opt}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>
				</div>
			</div>

			{/* Sample Output (hidden in compact mode) */}
			{!compact && (
				<div className="space-y-3">
					<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Sample Output
					</h3>
					<form.Field name="sampleOutput">
						{(field) => (
							<div className="space-y-1.5">
								<Textarea
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Paste an example of writing in this persona's style..."
									rows={4}
								/>
							</div>
						)}
					</form.Field>
				</div>
			)}

			{/* Preview (hidden in compact mode) */}
			{!compact && (
				<form.Subscribe selector={(state) => state.values}>
					{(values) => {
						const parts = [
							values.tone !== "neutral" && `${values.tone} tone`,
							values.formality !== "neutral" && `${values.formality} formality`,
							values.humor !== "none" && `${values.humor} humor`,
							`${values.vocabularyLevel} vocabulary`,
							`${values.perspective} perspective`,
							`${values.sentenceStyle} sentences`,
						].filter(Boolean);

						return (
							<div className="space-y-1.5">
								<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Preview
								</h3>
								<p className="text-muted-foreground text-xs">
									{parts.join(", ")}
								</p>
							</div>
						);
					}}
				</form.Subscribe>
			)}

			<form.Subscribe>
				{(state) => (
					<Button
						type="submit"
						disabled={!state.canSubmit || state.isSubmitting || isPending}
					>
						{isPending
							? "Saving..."
							: isEdit
								? "Save Changes"
								: "Create Persona"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
