const ElPaisScraper = require('../src/services/scraper');
const translator = require('../src/services/translator');
const analyzer = require('../src/services/analyzer');
const FileHelper = require('../src/utils/fileHelper');
const { Builder } = require('selenium-webdriver');

// Increase timeout for BrowserStack / scraping
jest.setTimeout(300000);

describe('El Pais Scraper Cross-Browser Test', () => {
    let scraper;
    let driver;
    let platformName = 'Unknown';

    beforeAll(async () => {
        driver = await new Builder().forBrowser('chrome').build();
        // Get platform info for cleaner logs
        try {
            const caps = await driver.getCapabilities();
            const platform = caps.get('platformName') || caps.get('platform') || 'Desktop';
            const browser = caps.get('browserName') || 'Browser';
            const version = caps.get('browserVersion') || caps.get('version') || '';
            platformName = `${platform} - ${browser} ${version}`.trim();
        } catch (e) {
            platformName = 'Remote Browser';
        }

        console.log(`[INIT] Starting session on: ${platformName}`);
        scraper = new ElPaisScraper(driver);
        await scraper.initializeDriver(driver);
    });

    afterAll(async () => {
        if (scraper) {
            console.log(`[SHUTDOWN] Closing session on: ${platformName}`);
            await scraper.close();
        }
    });

    test('should scrape, translate and analyze articles', async () => {
        console.log(`[START] Running workflow on: ${platformName}`);

        await scraper.navigateToHome();
        await scraper.handleCookies();
        await scraper.navigateToOpinion();

        const articles = await scraper.scrapeArticles();
        expect(articles && articles.length).toBeGreaterThan(0);

        const headers = articles.map(a => a.title);
        console.log(`[PROCESS] Found ${headers.length} headers. Translating on: ${platformName}`);

        const translated = await translator.translateHeaders(headers);
        expect(Array.isArray(translated)).toBe(true);

        console.log(`[ANALYZE] Word frequency analysis for: ${platformName}`);
        const repeatedWords = analyzer.analyzeRepeatedWords(translated);
        analyzer.printAnalysisResults(repeatedWords);

        console.log(`[FINISH] Successfully verified: ${platformName}`);
    });
});
