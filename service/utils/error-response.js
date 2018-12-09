import { logError } from '../logger';

export const ErrorIds = {
	badRequest: 'bottom-time/errors/bad-request',
	notFound: 'bottom-time/errors/resource-not-found',
	serverError: 'bottom-time/errors/server-error'
};

export function notFound(req, res) {
	res.status(404).json({
		errorId: ErrorIds.notFound,
		status: 404,
		message: 'Resource not found.',
		details: `The requested resource at "${req.baseUrl}" could not be found. Please check the specified route for errors.`
	});
}

export function badRequest(message, error, res) {
	res.status(400).json({
		errorId: ErrorIds.badRequest,
		status: 400,
		message: message,
		error
	});
}

export function serverError(res, logId) {
	res.status(500).json({
		errorId: ErrorIds.serverError,
		logId: logId,
		status: 500,
		message: 'A server error occurred.',
		details: 'Your request could not be completed at this time. Please try again later.'
	});
}

export function serverErrorMiddleware(req, res, next) {
	try {
		next();
	} catch(err) {
		const logId = logError(
			`An unexpected server error has occurred.`,
			err);
		serverError(res, logId);
	}
}
