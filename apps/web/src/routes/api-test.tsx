import { createFileRoute } from "@tanstack/react-router";
import { useWorkspaces } from "@/lib/hooks";

export const Route = createFileRoute("/api-test")({
	component: ApiTestComponent,
});

function ApiTestComponent() {
	const { data, isLoading, isError, error, refetch } = useWorkspaces();

	return (
		<div className="mx-auto max-w-2xl p-8">
			<h1 className="mb-6 font-bold text-2xl">TanStack Query API Test</h1>

			<div className="space-y-4">
				<div className="rounded-lg border bg-card p-4">
					<h2 className="mb-2 font-semibold">Query Status</h2>
					<div className="space-y-1 text-sm">
						<p>
							<span className="text-muted-foreground">Loading:</span>{" "}
							{isLoading ? "Yes" : "No"}
						</p>
						<p>
							<span className="text-muted-foreground">Error:</span>{" "}
							{isError ? "Yes" : "No"}
						</p>
						<p>
							<span className="text-muted-foreground">Data:</span>{" "}
							{data ? `${data.length} workspaces` : "None"}
						</p>
					</div>
				</div>

				{isLoading && (
					<div className="rounded-lg border bg-blue-500/10 p-4 text-blue-500">
						Loading workspaces...
					</div>
				)}

				{isError && (
					<div className="rounded-lg border bg-red-500/10 p-4 text-red-500">
						<p className="font-semibold">Error fetching workspaces</p>
						<p className="mt-1 text-sm">{error?.message}</p>
						<p className="mt-2 text-muted-foreground text-xs">
							(This is expected if the server doesn't have workspaces endpoints
							yet)
						</p>
					</div>
				)}

				{data && data.length > 0 && (
					<div className="rounded-lg border bg-green-500/10 p-4 text-green-500">
						<p className="font-semibold">Success!</p>
						<pre className="mt-2 overflow-auto text-xs">
							{JSON.stringify(data, null, 2)}
						</pre>
					</div>
				)}

				<button
					type="button"
					onClick={() => refetch()}
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
				>
					Refetch
				</button>
			</div>

			<div className="mt-8 rounded-lg border bg-muted/50 p-4">
				<h2 className="mb-2 font-semibold">How to Test</h2>
				<ol className="list-inside list-decimal space-y-1 text-muted-foreground text-sm">
					<li>
						Open TanStack Query DevTools (bottom right corner, tanstack icon)
					</li>
					<li>You should see a "workspaces" query appear</li>
					<li>The query will show as "fetching" then "stale" or "error"</li>
					<li>Click "Refetch" to trigger the query again</li>
					<li>
						Check the Query DevTools to see caching, stale time, and retry
						behavior
					</li>
				</ol>
			</div>
		</div>
	);
}
