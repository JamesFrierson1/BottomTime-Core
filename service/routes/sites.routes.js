import {
	assertWriteAccess,
	createSites,
	deleteSite,
	getSite,
	loadDiveSite,
	searchSites,
	updateSite
} from '../controllers/sites.controller';
import { RequireUser } from '../controllers/security.controller';

module.exports = app => {
	app.route('/diveSites')
		.get(searchSites)
		.post(RequireUser, createSites);
	app.route('/diveSites/:siteId([a-f0-9]{24})')
		.get(loadDiveSite, getSite)
		.put(RequireUser, loadDiveSite, assertWriteAccess, updateSite)
		.delete(RequireUser, loadDiveSite, assertWriteAccess, deleteSite);
};
