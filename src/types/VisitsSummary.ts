// Scrapeado manualmente desde https://demo.matomo.cloud/?module=API&method=VisitsSummary.get&idSite=1&period=day&date=yesterday&format=JSON&token_auth=anonymous
export default interface VisitsSumamry {
    nb_uniq_visitors: number;
    nb_users: number;
    nb_visits: number;
    nb_actions: number;
    nb_visits_converted: number;
    bounce_count: number;
    sum_visit_length: number;
    max_actions: number;
    bounce_rate: string;
    nb_actions_per_visit: number;
    avg_time_on_site: number;
}
