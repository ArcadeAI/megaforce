import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import {
	type JobProgressPayload,
	RoomType,
	useRealtimeUpdates,
	useRoomSubscription,
	useWebSocket,
	WS_EVENTS,
} from "@/lib/websocket";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		return { session };
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const { state, isAuthenticated } = useWebSocket({ autoConnect: false });

	// Subscribe to job progress events
	useRealtimeUpdates<JobProgressPayload>({
		event: WS_EVENTS.JOB_PROGRESS,
		onMessage: (payload) => {
			console.log("Job progress:", payload);
		},
	});

	// Subscribe to user room (for user-specific events)
	useRoomSubscription({
		rooms: session.data?.user.id
			? [{ type: RoomType.USER, id: session.data.user.id }]
			: [],
		enabled: isAuthenticated,
	});

	return (
		<div className="space-y-4 p-6">
			<h1 className="font-bold text-2xl">Dashboard</h1>
			<p>Welcome {session.data?.user.name}</p>

			<div className="space-y-2 rounded-lg border p-4">
				<h2 className="font-semibold">WebSocket Status</h2>
				<p>
					Connection State:{" "}
					<span
						className={`font-mono ${
							isAuthenticated
								? "text-green-600"
								: state === "ERROR"
									? "text-red-600"
									: "text-yellow-600"
						}`}
					>
						{state}
					</span>
				</p>
			</div>
		</div>
	);
}
