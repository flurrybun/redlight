import { err, ok, type Result } from "neverthrow";

export interface ApiError {
	title: string;
	message: string;
}

export interface ApiSuccess<T> {
	data: T;
}

export interface ApiFailure {
	error: ApiError;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function apiResponseToResult<T>(response: ApiResponse<T>): Result<T, ApiError> {
	if ("data" in response) {
		return ok(response.data);
	} else {
		return err(response.error);
	}
}
