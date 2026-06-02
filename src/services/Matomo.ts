import { ReportingClient } from '@mj-kiwi/matomo-client';
import { config } from '../config/config';
import VisitsSumamry from '../types/VisitsSummary';

/* cliente singleton de matomo*/
export default class Matomo {
    private static _instance: Matomo;
    client: ReportingClient | undefined;

    private constructor() {
        this.client = new ReportingClient({
            url: config.matomo.instance,
            tokenAuth: config.matomo.api
        });
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public async version(): Promise<string | undefined> {
        return await this.client?.api.getMatomoVersion();
    }

    public async getVisitsSummary(): Promise<VisitsSumamry> {
        // Yo supongo que esto devuelve como un json, por https://developer.matomo.org/api-reference/reporting-api#VisitsSummary
        return await this.client?.visitsSummary.get({
            idSite: 1,
            period: 'week',
            date: 'today'
        });
    }
}
