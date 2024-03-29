"use strict";

import { getBodyItems, getResponseItems } from './helpers';
import { validateHttpResponse } from './utils';
import { ValidationError, ResponseError } from './errors';
import { parseRequest } from './schema';
import { generateBKP, generatePKP } from './crypto';


export default class EETClient {

	constructor(client, options) {
		this.client = client;
		this.options = options;
	}

	/**
	 * Sends request to EET to get FIK
	 * @param request {object}
	 * @return {Promise.<object>}
	 * @throws ValidationError
	 * @throws ResponseError
	 */
	request(request) {

		return new Promise((resolve, reject) => {

			const { header, data } = parseRequest(request);

			const body = getBodyItems(this.options.privateKey, header, data);

			this.client.OdeslaniTrzby(
				body,
				(err, response) => {

					if (err) {
						return reject(err);
					}

					const elapsedTime = this.options.measureResponseTime ? this.client.lastElapsedTime : undefined;

					try {

						validateHttpResponse(response);

						return resolve({
							request: {
								...header,
								...data,
							},
							response: getResponseItems(response, elapsedTime),
						});

					} catch (err) {

						if (!this.options.offline) {
							return reject(err);
						}

						const pkp = generatePKP(this.options.privateKey, data);
						const bkp = generateBKP(pkp);

						return resolve({
							request: {
								...header,
								...data,
							},
							response: {
								pkp,
								bkp,
							},
							error: err,
						});

					}

				},
				{
					timeout: this.options.timeout,
					time: this.options.measureResponseTime,
				},
			);

		});

	}

}
