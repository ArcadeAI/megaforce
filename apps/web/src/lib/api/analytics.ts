import type { ApiResponse } from "./client";

/**
 * Analytics types
 */
export type TimeSeriesDataPoint = {
	timestamp: Date;
	value: number;
};

export type AnalyticsMetric = {
	name: string;
	value: number;
	change?: number;
	changePercentage?: number;
};

export type ProjectAnalytics = {
	projectId: string;
	metrics: {
		totalCandidates: AnalyticsMetric;
		approvedCandidates: AnalyticsMetric;
		rejectedCandidates: AnalyticsMetric;
		averageScore: AnalyticsMetric;
		publishedCount: AnalyticsMetric;
	};
	timeSeries: {
		candidates: TimeSeriesDataPoint[];
		approvals: TimeSeriesDataPoint[];
		publications: TimeSeriesDataPoint[];
	};
};

export type WorkspaceAnalytics = {
	workspaceId: string;
	metrics: {
		totalProjects: AnalyticsMetric;
		activeProjects: AnalyticsMetric;
		totalCandidates: AnalyticsMetric;
		totalPublished: AnalyticsMetric;
	};
	topProjects: Array<{
		projectId: string;
		projectName: string;
		candidateCount: number;
		publishedCount: number;
	}>;
};

export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "1y" | "all";

/**
 * Analytics API functions
 */
export const analyticsApi = {
	/**
	 * Get project analytics
	 */
	async getProjectAnalytics(
		_projectId: string,
		_timeRange: AnalyticsTimeRange = "30d",
	): Promise<ApiResponse<ProjectAnalytics>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Get workspace analytics
	 */
	async getWorkspaceAnalytics(
		_workspaceId: string,
		_timeRange: AnalyticsTimeRange = "30d",
	): Promise<ApiResponse<WorkspaceAnalytics>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},

	/**
	 * Export analytics data as CSV
	 */
	async exportAnalytics(
		_projectId: string,
		_timeRange: AnalyticsTimeRange = "30d",
	): Promise<ApiResponse<Blob>> {
		// TODO: Implement when backend endpoint is ready
		return {
			data: undefined,
			error: { message: "Not implemented" },
		};
	},
};
